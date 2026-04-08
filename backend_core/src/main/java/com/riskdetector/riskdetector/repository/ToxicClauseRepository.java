package com.riskdetector.riskdetector.repository;

import com.riskdetector.riskdetector.entity.ToxicClause;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ToxicClauseRepository extends JpaRepository<ToxicClause, String> {
    List<ToxicClause> findByAnalysisId(String analysisId);
}
