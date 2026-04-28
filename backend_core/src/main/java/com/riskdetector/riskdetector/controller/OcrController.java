package com.riskdetector.riskdetector.controller;

import com.riskdetector.riskdetector.dto.ocr.OcrResultResponse;
import com.riskdetector.riskdetector.dto.ocr.OcrUpdateRequest;
import com.riskdetector.riskdetector.dto.ocr.OcrUploadResponse;
import com.riskdetector.riskdetector.service.OcrProcessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
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
        log.info("OCR Upload request received. Email: {}, Title: {}, Files count: {}", email, title, files.size());
        OcrUploadResponse response = ocrProcessService.processUpload(email, title, contractType, files);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{contractId}")
    public ResponseEntity<OcrResultResponse> getOcrResult(
            @AuthenticationPrincipal String email,
            @PathVariable String contractId) {
        log.info("GET /api/ocr/{} requested by {}", contractId, email);
        OcrResultResponse response = ocrProcessService.getOcrResult(email, contractId);
        log.info("Returning {} items", (response.getHtmlArray() != null ? response.getHtmlArray().size() : 0));
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{contractId}")
    public ResponseEntity<OcrResultResponse> updateOcrContent(
            @AuthenticationPrincipal String email,
            @PathVariable String contractId,
            @RequestBody OcrUpdateRequest request) {
        OcrResultResponse response = ocrProcessService.updateOcrContent(email, contractId, request);
        return ResponseEntity.ok(response);
    }
}
