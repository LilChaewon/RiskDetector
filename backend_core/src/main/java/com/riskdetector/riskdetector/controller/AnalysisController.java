package com.riskdetector.riskdetector.controller;

import com.riskdetector.riskdetector.dto.analysis.AnalysisRequest;
import com.riskdetector.riskdetector.dto.analysis.AnalysisResultResponse;
import com.riskdetector.riskdetector.dto.analysis.AnalysisStartResponse;
import com.riskdetector.riskdetector.service.AnalysisProcessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisProcessService analysisProcessService;

    @PostMapping
    public ResponseEntity<AnalysisStartResponse> requestAnalysis(
            @AuthenticationPrincipal String email,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestSessionId,
            @RequestBody AnalysisRequest request) {
        AnalysisStartResponse response = analysisProcessService.requestAnalysis(email, guestSessionId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{analysisId}")
    public ResponseEntity<AnalysisResultResponse> getAnalysisResult(
            @AuthenticationPrincipal String email,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestSessionId,
            @PathVariable String analysisId) {
        AnalysisResultResponse response = analysisProcessService.getAnalysisResult(email, guestSessionId, analysisId);
        return ResponseEntity.ok(response);
    }
}
