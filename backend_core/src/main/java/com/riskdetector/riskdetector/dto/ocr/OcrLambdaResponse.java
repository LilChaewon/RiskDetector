package com.riskdetector.riskdetector.dto.ocr;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class OcrLambdaResponse {

    private boolean success;
    private Data data;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Data {
        @JsonProperty("html_entire")
        private String htmlEntire;

        @JsonProperty("html_array")
        private List<String> htmlArray;
    }
}
