package com.riskdetector.riskdetector.dto.ocr;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class OcrResultResponse {

    private String contractId;
    private String title;
    private String htmlEntire;
    private List<OcrUploadResponse.OcrContentDto> htmlArray;
}
