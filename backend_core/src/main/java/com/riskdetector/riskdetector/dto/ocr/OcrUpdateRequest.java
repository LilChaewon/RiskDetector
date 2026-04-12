package com.riskdetector.riskdetector.dto.ocr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrUpdateRequest {
    private String id;      // OcrContent의 고유 ID
    private String content; // 수정된 HTML 내용
}
