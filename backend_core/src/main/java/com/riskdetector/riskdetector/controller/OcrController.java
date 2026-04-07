package com.riskdetector.riskdetector.controller;

import com.riskdetector.riskdetector.dto.ocr.OcrResultResponse;
import com.riskdetector.riskdetector.dto.ocr.OcrUploadResponse;
import com.riskdetector.riskdetector.service.OcrProcessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrProcessService ocrProcessService;

    @PostMapping("/upload")
    public ResponseEntity<OcrUploadResponse> upload(
            @AuthenticationPrincipal String email,
            @RequestParam String title,
            @RequestParam String contractType,
            @RequestPart List<MultipartFile> files) {
        OcrUploadResponse response = ocrProcessService.processUpload(email, title, contractType, files);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{contractId}")
    public ResponseEntity<OcrResultResponse> getOcrResult(
            @AuthenticationPrincipal String email,
            @PathVariable String contractId) {
        OcrResultResponse response = ocrProcessService.getOcrResult(email, contractId);
        return ResponseEntity.ok(response);
    }
}
