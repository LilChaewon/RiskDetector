package com.riskdetector.riskdetector.dto.app;

public record UserSummaryResponse(
        String name,
        String email,
        String picture,
        boolean guest
) {
}
