package com.riskdetector.riskdetector.controller;

import com.riskdetector.riskdetector.dto.app.LegalTipResponse;
import com.riskdetector.riskdetector.service.AppReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tips")
@RequiredArgsConstructor
public class LegalTipController {

    private final AppReadService appReadService;

    @GetMapping
    public ResponseEntity<Page<LegalTipResponse>> getTips(
            @AuthenticationPrincipal String email,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestSessionId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(appReadService.getTips(email, guestSessionId, category, q, page, size));
    }

    @GetMapping("/{tipId}")
    public ResponseEntity<LegalTipResponse> getTip(
            @AuthenticationPrincipal String email,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestSessionId,
            @PathVariable Long tipId) {
        return ResponseEntity.ok(appReadService.getTip(email, guestSessionId, tipId));
    }

    @PostMapping("/{tipId}/bookmark")
    public ResponseEntity<LegalTipResponse> bookmarkTip(
            @AuthenticationPrincipal String email,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestSessionId,
            @PathVariable Long tipId) {
        return ResponseEntity.ok(appReadService.bookmarkTip(email, guestSessionId, tipId));
    }

    @DeleteMapping("/{tipId}/bookmark")
    public ResponseEntity<LegalTipResponse> unbookmarkTip(
            @AuthenticationPrincipal String email,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestSessionId,
            @PathVariable Long tipId) {
        return ResponseEntity.ok(appReadService.unbookmarkTip(email, guestSessionId, tipId));
    }
}
