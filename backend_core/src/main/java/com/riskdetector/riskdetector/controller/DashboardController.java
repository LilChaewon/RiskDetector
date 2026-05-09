package com.riskdetector.riskdetector.controller;

import com.riskdetector.riskdetector.dto.app.DashboardResponse;
import com.riskdetector.riskdetector.service.AppReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AppReadService appReadService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(
            @AuthenticationPrincipal String email,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestSessionId) {
        return ResponseEntity.ok(appReadService.getDashboard(email, guestSessionId));
    }
}
