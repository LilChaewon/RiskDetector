package com.riskdetector.riskdetector.dto.app;

public record DashboardStatsResponse(
        long totalContracts,
        long completedAnalyses,
        long bookmarkCount,
        long highRiskContracts
) {
}
