package com.riskdetector.riskdetector.repository;

import com.riskdetector.riskdetector.entity.OcrContent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OcrContentRepository extends JpaRepository<OcrContent, String> {
    List<OcrContent> findByContractIdOrderByTagIdx(String contractId);
}
