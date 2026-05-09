package com.riskdetector.riskdetector.repository;

import com.riskdetector.riskdetector.entity.ContractAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ContractAnalysisRepository extends JpaRepository<ContractAnalysis, String> {
    Optional<ContractAnalysis> findByContractId(String contractId);

    Optional<ContractAnalysis> findTopByContractIdOrderByCreatedAtDesc(String contractId);
}
