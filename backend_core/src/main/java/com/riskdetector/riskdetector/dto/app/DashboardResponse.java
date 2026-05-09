package com.riskdetector.riskdetector.dto.app;

import java.util.List;

public record DashboardResponse(
        UserSummaryResponse user,
        DashboardStatsResponse stats,
        List<ContractSummaryResponse> recentContracts,
        List<LegalTipResponse> featuredTips
) {
}
