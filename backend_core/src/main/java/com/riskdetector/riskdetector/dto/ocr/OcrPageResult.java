package com.riskdetector.riskdetector.dto.ocr;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class OcrPageResult {
    private int pageIdx;
    private List<OcrLambdaResponse.HtmlElement> elements;
    private boolean success;
}
