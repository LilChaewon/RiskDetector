package com.riskdetector.riskdetector.dto.app;

public record LegalTipResponse(
        Long id,
        String category,
        String question,
        String answer,
        String sourceUrl,
        long viewCount,
        boolean bookmarked
) {
}
