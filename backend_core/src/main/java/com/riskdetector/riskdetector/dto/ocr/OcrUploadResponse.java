package com.riskdetector.riskdetector.dto.ocr;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class OcrUploadResponse {

    private String contractId;
    private String title;
    private String ocrStatus;
    private List<OcrContentDto> contents;

    @Getter
    @Builder
    public static class OcrContentDto {
        private String id;
        private String category;
        private String content;
        private Integer tagIdx;
    }
}
