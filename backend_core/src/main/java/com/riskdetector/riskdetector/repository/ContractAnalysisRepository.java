package com.riskdetector.riskdetector.repository;

import com.riskdetector.riskdetector.entity.ContractAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ContractAnalysisRepository extends JpaRepository<ContractAnalysis, String> {
    /**
     * 해당 계약서의 가장 최근 분석 결과를 조회합니다.
     */
    Optional<ContractAnalysis> findFirstByContractIdOrderByCreatedAtDesc(String contractId);
}
