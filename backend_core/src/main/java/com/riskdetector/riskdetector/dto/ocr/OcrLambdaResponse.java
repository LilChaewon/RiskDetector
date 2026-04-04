package com.riskdetector.riskdetector.dto.ocr;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class OcrLambdaResponse {

    private Data data;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Data {
        private List<HtmlElement> htmlArray;
    }

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class HtmlElement {
        private String type;
        private String html;
        private String elementId;
    }
}
