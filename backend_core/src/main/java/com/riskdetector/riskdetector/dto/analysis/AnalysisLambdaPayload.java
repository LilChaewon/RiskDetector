package com.riskdetector.riskdetector.dto.analysis;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AnalysisLambdaPayload {
    private String contractId;
    private String analysisId;
    private List<String> contractTexts;
}
