package com.riskdetector.riskdetector.service;

import com.riskdetector.riskdetector.config.AwsConfig;
import com.riskdetector.riskdetector.dto.ocr.*;
import com.riskdetector.riskdetector.entity.Contract;
import com.riskdetector.riskdetector.entity.OcrContent;
import com.riskdetector.riskdetector.entity.User;
import com.riskdetector.riskdetector.exception.ResourceNotFoundException;
import com.riskdetector.riskdetector.repository.ContractRepository;
import com.riskdetector.riskdetector.repository.OcrContentRepository;
import com.riskdetector.riskdetector.repository.UserRepository;
import com.riskdetector.riskdetector.util.LambdaUtil;
import com.riskdetector.riskdetector.util.S3Util;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OcrProcessService {

    private final UserRepository userRepository;
    private final ContractRepository contractRepository;
    private final OcrContentRepository ocrContentRepository;
    private final S3Util s3Util;
    private final LambdaUtil lambdaUtil;
    private final AwsConfig awsConfig;
    private final Executor ocrExecutor;

    public OcrProcessService(
            UserRepository userRepository,
            ContractRepository contractRepository,
            OcrContentRepository ocrContentRepository,
            S3Util s3Util,
            LambdaUtil lambdaUtil,
            AwsConfig awsConfig,
            @Qualifier("ocrExecutor") Executor ocrExecutor) {
        this.userRepository = userRepository;
        this.contractRepository = contractRepository;
        this.ocrContentRepository = ocrContentRepository;
        this.s3Util = s3Util;
        this.lambdaUtil = lambdaUtil;
        this.awsConfig = awsConfig;
        this.ocrExecutor = ocrExecutor;
    }

    public OcrUploadResponse processUpload(String email, String title, String contractType,
                                           List<MultipartFile> files) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String contractId = UUID.randomUUID().toString();
        String s3KeyPrefix = "contracts/" + contractId + "/ocr/";

        Contract contract = contractRepository.save(
                Contract.builder()
                        .id(contractId)
                        .user(user)
                        .title(title)
                        .contractType(contractType)
                        .s3KeyPrefix(s3KeyPrefix)
                        .build()
        );

        // 각 페이지를 병렬로 OCR 처리
        List<CompletableFuture<OcrPageResult>> futures = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            futures.add(processOcrPageAsync(files.get(i), contractId, s3KeyPrefix, i));
        }

        // 전체 완료 대기 후 pageIdx 순으로 정렬
        List<OcrPageResult> results = futures.stream()
                .map(CompletableFuture::join)
                .filter(r -> r != null && r.isSuccess())
                .sorted(Comparator.comparingInt(OcrPageResult::getPageIdx))
                .collect(Collectors.toList());

        // OcrContent 저장 (tagIdx: 페이지 순서 * 100 + 요소 순서)
        List<OcrContent> savedContents = new ArrayList<>();
        for (OcrPageResult result : results) {
            List<OcrLambdaResponse.HtmlElement> elements = result.getElements();
            for (int elIdx = 0; elIdx < elements.size(); elIdx++) {
                OcrLambdaResponse.HtmlElement el = elements.get(elIdx);
                OcrContent ocrContent = ocrContentRepository.save(
                        OcrContent.builder()
                                .id(UUID.randomUUID().toString())
                                .contract(contract)
                                .content(el.getHtml())
                                .category(el.getType())
                                .tagIdx(result.getPageIdx() * 100 + elIdx)
                                .build()
                );
                savedContents.add(ocrContent);
            }
        }

        List<OcrUploadResponse.OcrContentDto> contentDtos = savedContents.stream()
                .map(c -> OcrUploadResponse.OcrContentDto.builder()
                        .id(c.getId())
                        .category(c.getCategory())
                        .content(c.getContent())
                        .tagIdx(c.getTagIdx())
                        .build())
                .collect(Collectors.toList());

        return OcrUploadResponse.builder()
                .contractId(contractId)
                .title(title)
                .contents(contentDtos)
                .build();
    }

    private CompletableFuture<OcrPageResult> processOcrPageAsync(
            MultipartFile file, String contractId, String s3KeyPrefix, int pageIdx) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                // S3 업로드는 실제로 수행
                String s3Key = s3KeyPrefix + pageIdx + "_" + file.getOriginalFilename();
                s3Util.upload(awsConfig.getS3().getServiceBucket(), s3Key, file);

                // ======= 실제 Lambda 호출 =======
                OcrLambdaPayload payload = new OcrLambdaPayload(s3Key, pageIdx);
                InvokeResponse response = lambdaUtil.invokeAndWait(
                        awsConfig.getLambda().getOcrFunctionName(), payload);

                if (lambdaUtil.hasError(response)) {
                    log.error("OCR Lambda 에러: {}", response.payload().asUtf8String());
                    return new OcrPageResult(pageIdx, Collections.emptyList(), false);
                }

                OcrLambdaResponse ocrResponse = lambdaUtil.parseResponse(response, OcrLambdaResponse.class);

                if (!ocrResponse.isSuccess()) {
                    return new OcrPageResult(pageIdx, Collections.emptyList(), false);
                }

                return new OcrPageResult(pageIdx, ocrResponse.getData().getHtmlArray(), true);

            } catch (Exception e) {
                log.error("OCR 처리 실패: {}", e.getMessage());
                return null;
            }
        }, ocrExecutor);
    }
}
