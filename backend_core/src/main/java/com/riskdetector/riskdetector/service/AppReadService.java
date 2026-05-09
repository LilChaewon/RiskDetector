package com.riskdetector.riskdetector.service;

import com.riskdetector.riskdetector.dto.app.*;
import com.riskdetector.riskdetector.entity.*;
import com.riskdetector.riskdetector.exception.ResourceNotFoundException;
import com.riskdetector.riskdetector.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AppReadService {

    private final UserRepository userRepository;
    private final ContractRepository contractRepository;
    private final ContractAnalysisRepository contractAnalysisRepository;
    private final ToxicClauseRepository toxicClauseRepository;
    private final LegalTipRepository legalTipRepository;
    private final LegalTipBookmarkRepository legalTipBookmarkRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String email, String guestSessionId) {
        Scope scope = scope(email, guestSessionId);
        List<Contract> contracts = contractRepository
                .findAccessibleContracts(scope.email(), scope.guestSessionId(), Pageable.unpaged())
                .getContent();
        List<ContractSummaryResponse> recent = contracts.stream()
                .limit(5)
                .map(this::toContractSummary)
                .toList();

        long completed = recentOrAllCompletedCount(contracts);
        long highRisk = contracts.stream()
                .map(this::toContractSummary)
                .filter(c -> c.maxWarnLevel() >= 3)
                .count();

        List<LegalTipResponse> featured = legalTipRepository.findTop5ByOrderByViewCountDescCreatedAtDesc()
                .stream()
                .map(t -> toTipResponse(t, scope))
                .toList();

        return new DashboardResponse(
                getUserSummary(scope),
                new DashboardStatsResponse(
                        contractRepository.countAccessibleContracts(scope.email(), scope.guestSessionId()),
                        completed,
                        countBookmarks(scope),
                        highRisk
                ),
                recent,
                featured
        );
    }

    @Transactional(readOnly = true)
    public Page<ContractSummaryResponse> getContracts(String email, String guestSessionId, int page, int size) {
        Scope scope = scope(email, guestSessionId);
        return contractRepository
                .findAccessibleContracts(scope.email(), scope.guestSessionId(), PageRequest.of(page, size))
                .map(this::toContractSummary);
    }

    @Transactional(readOnly = true)
    public ContractSummaryResponse getContract(String email, String guestSessionId, String contractId) {
        Scope scope = scope(email, guestSessionId);
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));
        if (!canAccess(contract, scope)) {
            throw new ResourceNotFoundException("Contract not found: " + contractId);
        }
        return toContractSummary(contract);
    }

    @Transactional(readOnly = true)
    public Page<LegalTipResponse> getTips(String email, String guestSessionId, String category, String q, int page, int size) {
        Scope scope = scope(email, guestSessionId);
        return legalTipRepository.search(nullToBlank(category), nullToBlank(q), PageRequest.of(page, size))
                .map(t -> toTipResponse(t, scope));
    }

    @Transactional
    public LegalTipResponse getTip(String email, String guestSessionId, Long tipId) {
        Scope scope = scope(email, guestSessionId);
        LegalTip tip = legalTipRepository.findById(tipId)
                .orElseThrow(() -> new ResourceNotFoundException("Legal tip not found: " + tipId));
        tip.incrementViewCount();
        return toTipResponse(tip, scope);
    }

    @Transactional
    public LegalTipResponse bookmarkTip(String email, String guestSessionId, Long tipId) {
        Scope scope = scope(email, guestSessionId);
        LegalTip tip = legalTipRepository.findById(tipId)
                .orElseThrow(() -> new ResourceNotFoundException("Legal tip not found: " + tipId));
        if (!isBookmarked(tip.getId(), scope)) {
            User user = scope.email() == null ? null : userRepository.findByEmail(scope.email())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            legalTipBookmarkRepository.save(
                    LegalTipBookmark.builder()
                            .tip(tip)
                            .user(user)
                            .guestSessionId(scope.guestSessionId())
                            .build()
            );
        }
        return toTipResponse(tip, scope);
    }

    @Transactional
    public LegalTipResponse unbookmarkTip(String email, String guestSessionId, Long tipId) {
        Scope scope = scope(email, guestSessionId);
        LegalTip tip = legalTipRepository.findById(tipId)
                .orElseThrow(() -> new ResourceNotFoundException("Legal tip not found: " + tipId));
        bookmarkFor(tipId, scope).ifPresent(legalTipBookmarkRepository::delete);
        return toTipResponse(tip, scope);
    }

    private long recentOrAllCompletedCount(List<Contract> contracts) {
        return contracts.stream()
                .map(c -> contractAnalysisRepository.findTopByContractIdOrderByCreatedAtDesc(c.getId()).orElse(null))
                .filter(Objects::nonNull)
                .filter(a -> "COMPLETED".equals(a.getProcessStatus()))
                .count();
    }

    private ContractSummaryResponse toContractSummary(Contract contract) {
        ContractAnalysis analysis = contractAnalysisRepository.findTopByContractIdOrderByCreatedAtDesc(contract.getId()).orElse(null);
        if (analysis == null) {
            return new ContractSummaryResponse(
                    contract.getId(),
                    null,
                    contract.getTitle(),
                    contract.getContractType(),
                    contract.getCreatedAt(),
                    "not_started",
                    0,
                    0,
                    0,
                    0,
                    0
            );
        }

        List<ToxicClause> toxics = toxicClauseRepository.findByAnalysisId(analysis.getId());
        int high = (int) toxics.stream().filter(t -> level(t) >= 3).count();
        int medium = (int) toxics.stream().filter(t -> level(t) == 2).count();
        int low = (int) toxics.stream().filter(t -> level(t) <= 1).count();
        int max = toxics.stream().mapToInt(this::level).max().orElse(0);

        String status = "IN_PROGRESS".equals(analysis.getProcessStatus()) ? "in_progress" :
                "COMPLETED".equals(analysis.getProcessStatus()) ? "completed" : "failed";

        return new ContractSummaryResponse(
                contract.getId(),
                analysis.getId(),
                contract.getTitle(),
                contract.getContractType(),
                contract.getCreatedAt(),
                status,
                toxics.size(),
                high,
                medium,
                low,
                max
        );
    }

    private int level(ToxicClause toxic) {
        return toxic.getWarnLevel() == null ? 1 : toxic.getWarnLevel();
    }

    private UserSummaryResponse getUserSummary(Scope scope) {
        if (scope.email() == null) {
            return new UserSummaryResponse("게스트", null, null, true);
        }
        User user = userRepository.findByEmail(scope.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new UserSummaryResponse(user.getName(), user.getEmail(), user.getPicture(), false);
    }

    private LegalTipResponse toTipResponse(LegalTip tip, Scope scope) {
        return new LegalTipResponse(
                tip.getId(),
                tip.getCategory(),
                tip.getQuestion(),
                tip.getAnswer(),
                tip.getSourceUrl(),
                tip.getViewCount() == null ? 0L : tip.getViewCount(),
                isBookmarked(tip.getId(), scope)
        );
    }

    private long countBookmarks(Scope scope) {
        if (scope.email() != null) return legalTipBookmarkRepository.countByUserEmail(scope.email());
        if (scope.guestSessionId() != null) return legalTipBookmarkRepository.countByGuestSessionId(scope.guestSessionId());
        return 0L;
    }

    private boolean isBookmarked(Long tipId, Scope scope) {
        return bookmarkFor(tipId, scope).isPresent();
    }

    private java.util.Optional<LegalTipBookmark> bookmarkFor(Long tipId, Scope scope) {
        if (scope.email() != null) return legalTipBookmarkRepository.findByTipIdAndUserEmail(tipId, scope.email());
        if (scope.guestSessionId() != null) return legalTipBookmarkRepository.findByTipIdAndGuestSessionId(tipId, scope.guestSessionId());
        return java.util.Optional.empty();
    }

    private boolean canAccess(Contract contract, Scope scope) {
        if (scope.email() != null && contract.getUser() != null) {
            return scope.email().equals(contract.getUser().getEmail());
        }
        return scope.guestSessionId() != null && scope.guestSessionId().equals(contract.getGuestSessionId());
    }

    private Scope scope(String email, String guestSessionId) {
        if (!isGuest(email)) return new Scope(email, null);
        return new Scope(null, StringUtils.hasText(guestSessionId) ? guestSessionId.trim() : null);
    }

    private boolean isGuest(String email) {
        return email == null || email.isBlank() || "anonymousUser".equals(email);
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value.trim();
    }

    private record Scope(String email, String guestSessionId) {
    }
}
