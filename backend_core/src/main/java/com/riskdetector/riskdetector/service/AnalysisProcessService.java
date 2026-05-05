package com.riskdetector.riskdetector.service;

import com.riskdetector.riskdetector.config.AwsConfig;
import com.riskdetector.riskdetector.dto.analysis.AnalysisLambdaPayload;
import com.riskdetector.riskdetector.dto.analysis.AnalysisLambdaResponse;
import com.riskdetector.riskdetector.dto.analysis.AnalysisRequest;
import com.riskdetector.riskdetector.dto.analysis.AnalysisResultResponse;
import com.riskdetector.riskdetector.dto.analysis.AnalysisStartResponse;
import com.riskdetector.riskdetector.entity.Contract;
import com.riskdetector.riskdetector.entity.ContractAnalysis;
import com.riskdetector.riskdetector.entity.OcrContent;
import com.riskdetector.riskdetector.entity.ToxicClause;
import com.riskdetector.riskdetector.exception.ResourceNotFoundException;
import com.riskdetector.riskdetector.repository.ContractAnalysisRepository;
import com.riskdetector.riskdetector.repository.ContractRepository;
import com.riskdetector.riskdetector.repository.OcrContentRepository;
import com.riskdetector.riskdetector.repository.ToxicClauseRepository;
import com.riskdetector.riskdetector.util.LambdaUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AnalysisProcessService {

    private final ContractRepository contractRepository;
    private final ContractAnalysisRepository contractAnalysisRepository;
    private final ToxicClauseRepository toxicClauseRepository;
    private final OcrContentRepository ocrContentRepository;
    private final LambdaUtil lambdaUtil;
    private final AwsConfig awsConfig;
    private final Executor analysisExecutor;

    public AnalysisProcessService(
            ContractRepository contractRepository,
            ContractAnalysisRepository contractAnalysisRepository,
            ToxicClauseRepository toxicClauseRepository,
            OcrContentRepository ocrContentRepository,
            LambdaUtil lambdaUtil,
            AwsConfig awsConfig,
            @Qualifier("analysisExecutor") Executor analysisExecutor) {
        this.contractRepository = contractRepository;
        this.contractAnalysisRepository = contractAnalysisRepository;
        this.toxicClauseRepository = toxicClauseRepository;
        this.ocrContentRepository = ocrContentRepository;
        this.lambdaUtil = lambdaUtil;
        this.awsConfig = awsConfig;
        this.analysisExecutor = analysisExecutor;
    }

    @Transactional
    public AnalysisStartResponse requestAnalysis(String email, AnalysisRequest request) {
        Contract contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + request.getContractId()));

        if (!hasAccess(contract, email)) {
            throw new ResourceNotFoundException("Contract not found: " + request.getContractId());
        }

        Optional<ContractAnalysis> existing = contractAnalysisRepository.findByContractId(request.getContractId());
        if (existing.isPresent() && "IN_PROGRESS".equals(existing.get().getProcessStatus())) {
            return new AnalysisStartResponse(existing.get().getId());
        }

        String analysisId = UUID.randomUUID().toString();
        contractAnalysisRepository.save(
                ContractAnalysis.builder()
                        .id(analysisId)
                        .contract(contract)
                        .processStatus("IN_PROGRESS")
                        .status("success")
                        .build()
        );

        List<OcrContent> ocrContents = ocrContentRepository.findByContractIdOrderByTagIdx(request.getContractId());
        List<String> contractTexts = groupByPage(ocrContents);

        CompletableFuture.runAsync(() -> invokeAnalysisLambda(analysisId, request.getContractId(), contractTexts),
                analysisExecutor);

        return new AnalysisStartResponse(analysisId);
    }

    @Transactional(readOnly = true)
    public AnalysisResultResponse getAnalysisResult(String email, String analysisId) {
        ContractAnalysis analysis = contractAnalysisRepository.findById(analysisId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis not found: " + analysisId));

        if (!hasAccess(analysis.getContract(), email)) {
            throw new ResourceNotFoundException("Analysis not found: " + analysisId);
        }

        List<ToxicClause> toxics = toxicClauseRepository.findByAnalysisId(analysisId);
        List<OcrContent> ocrContents = ocrContentRepository
                .findByContractIdOrderByTagIdx(analysis.getContract().getId());

        return AnalysisResultResponse.of(analysis, toxics, ocrContents);
    }

    private void invokeAnalysisLambda(String analysisId, String contractId, List<String> contractTexts) {
        try {
            AnalysisLambdaPayload payload = AnalysisLambdaPayload.builder()
                    .contractId(contractId)
                    .analysisId(analysisId)
                    .contractTexts(contractTexts)
                    .build();

            // 비동기(Event) 방식으로 Lambda 호출 - 즉시 반환 (202 Accepted)
            // Lambda 실행 완료 후 Destination → SQS → analysis_result_loader → DB 저장
            lambdaUtil.invokeAsync(awsConfig.getLambda().getAnalysisFunctionName(), payload);
            log.info("Analysis Lambda 비동기 호출 완료 (analysisId={}, contractId={})", analysisId, contractId);

        } catch (Exception e) {
            // 스택트레이스까지 남겨야 PayloadTooLarge / Timeout / Credentials 만료 등 실제 원인을 식별 가능
            log.error("Analysis Lambda 호출 실패 (analysisId={}, contractId={}, pageCount={}): {}",
                    analysisId, contractId, contractTexts.size(), e.toString(), e);
            ContractAnalysis analysis = contractAnalysisRepository.findById(analysisId).orElseThrow();
            analysis.fail();
            contractAnalysisRepository.save(analysis);
        }
    }

    private List<String> groupByPage(List<OcrContent> ocrContents) {
        return ocrContents.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getTagIdx() / 100,
                        TreeMap::new,
                        Collectors.mapping(OcrContent::getContent, Collectors.joining("\n"))
                ))
                .values().stream()
                .collect(Collectors.toList());
    }

    private String buildOverallComment(AnalysisLambdaResponse.AnalysisResult result) {
        String level = result.getRiskLevel() != null ? result.getRiskLevel().toUpperCase() : "UNKNOWN";
        return String.format("위험도: %s | %s", level, result.getSummary() != null ? result.getSummary() : "");
    }

    private String buildWarningComment(List<AnalysisLambdaResponse.Toxic> toxics) {
        if (toxics.isEmpty()) return "특이 사항 없음";
        return toxics.stream()
                .map(AnalysisLambdaResponse.Toxic::getRiskType)
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
    }

    private String buildAdvice(List<AnalysisLambdaResponse.Toxic> toxics) {
        return toxics.stream()
                .map(AnalysisLambdaResponse.Toxic::getSuggestion)
                .filter(s -> s != null && !s.isBlank())
                .findFirst()
                .orElse("법률 전문가 상담을 권장합니다.");
    }

    private String formatSourceIds(List<String> sourceIds) {
        if (sourceIds == null || sourceIds.isEmpty()) return null;
        return String.join(", ", sourceIds);
    }

    private int toWarnLevel(String riskLevel) {
        if ("high".equalsIgnoreCase(riskLevel)) return 3;
        if ("medium".equalsIgnoreCase(riskLevel)) return 2;
        return 1;
    }

    private boolean isGuest(String email) {
        return email == null || email.isBlank() || "anonymousUser".equals(email);
    }

    private boolean hasAccess(Contract contract, String email) {
        if (contract.getUser() == null) return true;
        return !isGuest(email) && contract.getUser().getEmail().equals(email);
    }
}
