package com.riskdetector.riskdetector.controller;

import com.riskdetector.riskdetector.dto.app.ContractSummaryResponse;
import com.riskdetector.riskdetector.service.AppReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final AppReadService appReadService;

    @GetMapping
    public ResponseEntity<Page<ContractSummaryResponse>> getContracts(
            @AuthenticationPrincipal String email,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestSessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(appReadService.getContracts(email, guestSessionId, page, size));
    }

    @GetMapping("/{contractId}")
    public ResponseEntity<ContractSummaryResponse> getContract(
            @AuthenticationPrincipal String email,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestSessionId,
            @PathVariable String contractId) {
        return ResponseEntity.ok(appReadService.getContract(email, guestSessionId, contractId));
    }
}
