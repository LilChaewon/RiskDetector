package com.riskdetector.riskdetector.dto.ocr;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OcrLambdaPayload {
    private String s3Key;
    private int pageIdx;
}
