package com.riskdetector.riskdetector.dto.app;

import java.time.LocalDateTime;

public record ContractSummaryResponse(
        String contractId,
        String analysisId,
        String title,
        String contractType,
        LocalDateTime createdAt,
        String analysisStatus,
        int toxicCount,
        int highRiskCount,
        int mediumRiskCount,
        int lowRiskCount,
        int maxWarnLevel
) {
}
