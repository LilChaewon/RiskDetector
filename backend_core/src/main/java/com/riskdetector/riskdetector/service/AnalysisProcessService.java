package com.riskdetector.riskdetector.service;

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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Slf4j
@Service
public class AnalysisProcessService {

    private final ContractRepository contractRepository;
    private final ContractAnalysisRepository contractAnalysisRepository;
    private final ToxicClauseRepository toxicClauseRepository;
    private final OcrContentRepository ocrContentRepository;
    private final Executor analysisExecutor;

    public AnalysisProcessService(
            ContractRepository contractRepository,
            ContractAnalysisRepository contractAnalysisRepository,
            ToxicClauseRepository toxicClauseRepository,
            OcrContentRepository ocrContentRepository,
            @Qualifier("analysisExecutor") Executor analysisExecutor) {
        this.contractRepository = contractRepository;
        this.contractAnalysisRepository = contractAnalysisRepository;
        this.toxicClauseRepository = toxicClauseRepository;
        this.ocrContentRepository = ocrContentRepository;
        this.analysisExecutor = analysisExecutor;
    }

    public AnalysisStartResponse requestAnalysis(String email, AnalysisRequest request) {
        Contract contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + request.getContractId()));

        if (!contract.getUser().getEmail().equals(email)) {
            throw new ResourceNotFoundException("Contract not found: " + request.getContractId());
        }

        // 이미 IN_PROGRESS인 분석이 있으면 그대로 반환
        Optional<ContractAnalysis> existing = contractAnalysisRepository.findByContractId(request.getContractId());
        if (existing.isPresent() && "IN_PROGRESS".equals(existing.get().getProcessStatus())) {
            return new AnalysisStartResponse(existing.get().getId());
        }

        // 분석 레코드 생성
        String analysisId = UUID.randomUUID().toString();
        ContractAnalysis analysis = contractAnalysisRepository.save(
                ContractAnalysis.builder()
                        .id(analysisId)
                        .contract(contract)
                        .processStatus("IN_PROGRESS")
                        .status("success")
                        .build()
        );

        // ======= 더미 처리 (bedrock_lambda AI팀 배포 전) =======
        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(3000);

                ContractAnalysis saved = contractAnalysisRepository.findById(analysisId)
                        .orElseThrow();
                saved.complete(
                        "이 계약서는 임차인에게 다소 불리한 조항이 포함되어 있습니다.",
                        "전반적으로 주의가 필요합니다.",
                        "원상복구 조항을 확인하세요.",
                        "법률 전문가 상담을 권장합니다."
                );
                ContractAnalysis completed = contractAnalysisRepository.save(saved);

                ToxicClause toxic = ToxicClause.builder()
                        .id(UUID.randomUUID().toString())
                        .analysis(completed)
                        .title("과도한 원상복구 조항")
                        .clause("임차인은 퇴거 시 모든 비용을 부담한다.")
                        .reason("자연 마모까지 임차인 책임으로 규정한 위법 소지 조항")
                        .reasonReference("민법 제654조에 의하면...")
                        .sourceContractTagIdx(1)
                        .warnLevel(3)
                        .build();
                toxicClauseRepository.save(toxic);

                log.info("더미 분석 완료: analysisId={}", analysisId);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("더미 분석 처리 실패: {}", e.getMessage());
            }
        }, analysisExecutor);
        // ======= 더미 처리 끝 =======

        return new AnalysisStartResponse(analysisId);
    }

    public AnalysisResultResponse getAnalysisResult(String email, String analysisId) {
        ContractAnalysis analysis = contractAnalysisRepository.findById(analysisId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis not found: " + analysisId));

        if (!analysis.getContract().getUser().getEmail().equals(email)) {
            throw new ResourceNotFoundException("Analysis not found: " + analysisId);
        }

        List<ToxicClause> toxics = toxicClauseRepository.findByAnalysisId(analysisId);
        List<OcrContent> ocrContents = ocrContentRepository
                .findByContractIdOrderByTagIdx(analysis.getContract().getId());

        return AnalysisResultResponse.of(analysis, toxics, ocrContents);
    }
}
