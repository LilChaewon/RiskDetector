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
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Safelist;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
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

    private static final int OCR_MAX_ATTEMPTS = 3;
    private static final long OCR_PAGE_DELAY_MS = 1500L;

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

    public OcrUploadResponse processUpload(String email, String guestSessionId, String title, String contractType,
                                           List<MultipartFile> files) {
        User user = isGuest(email) ? null : userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String effectiveGuestSessionId = user == null && StringUtils.hasText(guestSessionId)
                ? guestSessionId.trim()
                : null;

        String contractId = UUID.randomUUID().toString();
        String s3KeyPrefix = "contracts/" + contractId + "/ocr/";

        Contract contract = contractRepository.save(
                Contract.builder()
                        .id(contractId)
                        .user(user)
                        .title(title)
                        .contractType(contractType)
                        .guestSessionId(effectiveGuestSessionId)
                        .s3KeyPrefix(s3KeyPrefix)
                        .build()
        );

        log.info("Starting OCR process for contractId: {}", contractId);
        
        // Upstage OCR rate limit 방지를 위해 페이지는 순차 처리한다.
        List<OcrPageResult> results = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            log.info("Submitting OCR task for page {}", i);
            OcrPageResult result = processOcrPageAsync(files.get(i), contractId, s3KeyPrefix, i).join();
            if (result != null && result.isSuccess()) {
                results.add(result);
            }
            if (i + 1 < files.size()) {
                sleepQuietly(OCR_PAGE_DELAY_MS);
            }
        }
        results.sort(Comparator.comparingInt(OcrPageResult::getPageIdx));

        // OcrContent 저장 (tagIdx: 페이지 순서 * 100 + 요소 순서)
        List<OcrContent> savedContents = new ArrayList<>();
        for (OcrPageResult result : results) {
            List<String> elements = result.getElements();
            for (int elIdx = 0; elIdx < elements.size(); elIdx++) {
                String html = elements.get(elIdx);
                String sanitizedHtml = Jsoup.clean(html, Safelist.relaxed());
                OcrContent ocrContent = ocrContentRepository.save(
                        OcrContent.builder()
                                .id(UUID.randomUUID().toString())
                                .contract(contract)
                                .content(sanitizedHtml)
                                .category(extractCategory(html))
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

        String ocrStatus = savedContents.isEmpty() ? "fail" :
                          (results.size() < files.size() ? "partial_success" : "success");

        return OcrUploadResponse.builder()
                .contractId(contractId)
                .title(title)
                .ocrStatus(ocrStatus)
                .contents(contentDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public OcrResultResponse getOcrResult(String email, String guestSessionId, String contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));

        if (!hasAccess(contract, email, guestSessionId)) {
            throw new ResourceNotFoundException("Contract not found: " + contractId);
        }

        List<OcrContent> contents = ocrContentRepository.findByContractIdOrderByTagIdx(contractId);

        List<OcrUploadResponse.OcrContentDto> htmlArray = contents.stream()
                .map(c -> OcrUploadResponse.OcrContentDto.builder()
                        .id(c.getId())
                        .category(c.getCategory())
                        .content(c.getContent())
                        .tagIdx(c.getTagIdx())
                        .build())
                .collect(Collectors.toList());

        String htmlEntire = contents.stream()
                .map(OcrContent::getContent)
                .collect(Collectors.joining("\n"));

        return OcrResultResponse.builder()
                .contractId(contractId)
                .title(contract.getTitle())
                .htmlEntire(htmlEntire)
                .htmlArray(htmlArray)
                .build();
    }
    @Transactional
    public OcrResultResponse updateOcrContent(String email, String guestSessionId, String contractId, OcrUpdateRequest request) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));

        if (!hasAccess(contract, email, guestSessionId)) {
            throw new ResourceNotFoundException("Unauthorized access to contract");
        }

        OcrContent content = ocrContentRepository.findById(request.getId())
                .orElseThrow(() -> new ResourceNotFoundException("OCR Block not found: " + request.getId()));

        // 보안 검증: 수정하려는 블록이 해당 계약서에 속해 있는지 확인
        if (!content.getContract().getId().equals(contractId)) {
            throw new ResourceNotFoundException("Inconsistent block-contract relationship");
        }

        // HTML Sanitization
        String sanitizedContent = Jsoup.clean(request.getContent(), Safelist.relaxed());
        content.setContent(sanitizedContent);
        ocrContentRepository.save(content);

        return getOcrResult(email, guestSessionId, contractId);
    }

    private boolean isGuest(String email) {
        return email == null || email.isBlank() || "anonymousUser".equals(email);
    }

    private boolean hasAccess(Contract contract, String email, String guestSessionId) {
        // 소유자가 있으면 이메일 일치 필요
        if (contract.getUser() != null) {
            return !isGuest(email) && contract.getUser().getEmail().equals(email);
        }
        // 이전 게스트 계약은 session id가 없을 수 있어 contractId 접근을 유지한다.
        if (!StringUtils.hasText(contract.getGuestSessionId())) return true;
        return StringUtils.hasText(guestSessionId) && contract.getGuestSessionId().equals(guestSessionId.trim());
    }

    private String extractCategory(String html) {
        if (html.contains("<h1")) return "heading";
        if (html.contains("<p")) return "paragraph";
        if (html.contains("<table")) return "table";
        return "unknown";
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
                for (int attempt = 1; attempt <= OCR_MAX_ATTEMPTS; attempt++) {
                    InvokeResponse response = lambdaUtil.invokeAndWait(
                            awsConfig.getLambda().getOcrFunctionName(), payload);

                    String rawPayload = response.payload().asUtf8String();
                    log.info("OCR Lambda 응답 (pageIdx={}, attempt={}): {}", pageIdx, attempt, rawPayload);

                    if (lambdaUtil.hasError(response)) {
                        log.error("OCR Lambda functionError (pageIdx={}, attempt={}): {}", pageIdx, attempt, rawPayload);
                        if (attempt < OCR_MAX_ATTEMPTS && isRateLimited(rawPayload)) {
                            sleepQuietly(OCR_PAGE_DELAY_MS * attempt);
                            continue;
                        }
                        return new OcrPageResult(pageIdx, Collections.emptyList(), false);
                    }

                    OcrLambdaResponse ocrResponse = lambdaUtil.parseResponse(response, OcrLambdaResponse.class);

                    if (!ocrResponse.isSuccess()) {
                        log.warn("OCR Lambda success=false (pageIdx={}, attempt={}): {}", pageIdx, attempt, rawPayload);
                        if (attempt < OCR_MAX_ATTEMPTS && isRateLimited(rawPayload)) {
                            sleepQuietly(OCR_PAGE_DELAY_MS * attempt);
                            continue;
                        }
                        return new OcrPageResult(pageIdx, Collections.emptyList(), false);
                    }

                    List<String> htmlArray = extractHtmlElements(ocrResponse.getData());
                    return new OcrPageResult(pageIdx, htmlArray, true);
                }

                return new OcrPageResult(pageIdx, Collections.emptyList(), false);

            } catch (Exception e) {
                log.error("OCR 처리 실패: {}", e.getMessage());
                return null;
            }
        }, ocrExecutor);
    }

    private boolean isRateLimited(String payload) {
        return payload != null && (payload.contains("429") || payload.contains("too_many_requests"));
    }

    private List<String> extractHtmlElements(OcrLambdaResponse.Data data) {
        if (data == null) return Collections.emptyList();
        if (data.getHtmlArray() != null && !data.getHtmlArray().isEmpty()) {
            return data.getHtmlArray();
        }
        if (!StringUtils.hasText(data.getHtmlEntire())) {
            return Collections.emptyList();
        }
        return Jsoup.parseBodyFragment(data.getHtmlEntire())
                .body()
                .children()
                .stream()
                .map(Element::outerHtml)
                .collect(Collectors.toList());
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
