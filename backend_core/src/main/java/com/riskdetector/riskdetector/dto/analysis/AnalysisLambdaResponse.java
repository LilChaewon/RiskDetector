package com.riskdetector.riskdetector.dto.analysis;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class AnalysisLambdaResponse {

    private boolean success;
    private String error;
    private Data data;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Data {
        private AnalysisResult analysisResult;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class AnalysisResult {
        private String title;
        private String summary;
        private String riskLevel;
        private String groundingStatus;
        private int toxicCount;
        private List<Toxic> toxics;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Toxic {
        private String clauseText;
        private String riskType;
        private String riskLevel;
        private String reason;
        private String suggestion;
        private List<String> sourceIds;
    }
}
