package com.riskdetector.riskdetector.dto.analysis;

import com.riskdetector.riskdetector.entity.ContractAnalysis;
import com.riskdetector.riskdetector.entity.OcrContent;
import com.riskdetector.riskdetector.entity.ToxicClause;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class AnalysisResultResponse {

    private String originContent;
    private String summary;
    private String analysisStatus; // "in_progress", "completed", "failed"
    private int toxicCount;
    private List<ToxicDto> toxics;
    private RiskdetectorCommentary riskdetectorCommentary;

    @Getter
    @Builder
    public static class ToxicDto {
        private String title;
        private String clause;
        private String reason;
        private String reasonReference;
        private Integer warnLevel;
    }

    @Getter
    @Builder
    public static class RiskdetectorCommentary {
        private String overallComment;
        private String warningComment;
        private String advice;
    }

    public static AnalysisResultResponse of(ContractAnalysis analysis,
                                            List<ToxicClause> toxics,
                                            List<OcrContent> ocrContents) {
        String originContent = ocrContents.stream()
                .map(OcrContent::getContent)
                .collect(Collectors.joining("\n"));

        String analysisStatus =
                "IN_PROGRESS".equals(analysis.getProcessStatus()) ? "in_progress" :
                "COMPLETED".equals(analysis.getProcessStatus()) ? "completed" : "failed";

        return AnalysisResultResponse.builder()
                .originContent(originContent)
                .summary(analysis.getSummary())
                .analysisStatus(analysisStatus)
                .toxicCount(toxics.size())
                .toxics(toxics.stream()
                        .map(t -> ToxicDto.builder()
                                .title(t.getTitle())
                                .clause(t.getClause())
                                .reason(t.getReason())
                                .reasonReference(t.getReasonReference())
                                .warnLevel(t.getWarnLevel())
                                .build())
                        .collect(Collectors.toList()))
                .riskdetectorCommentary(RiskdetectorCommentary.builder()
                        .overallComment(analysis.getRiskdetectorOverallComment())
                        .warningComment(analysis.getRiskdetectorWarningComment())
                        .advice(analysis.getRiskdetectorAdvice())
                        .build())
                .build();
    }
}
