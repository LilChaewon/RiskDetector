package com.riskdetector.riskdetector.repository;

import com.riskdetector.riskdetector.entity.LegalTipBookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LegalTipBookmarkRepository extends JpaRepository<LegalTipBookmark, Long> {

    Optional<LegalTipBookmark> findByTipIdAndUserEmail(Long tipId, String email);

    Optional<LegalTipBookmark> findByTipIdAndGuestSessionId(Long tipId, String guestSessionId);

    long countByUserEmail(String email);

    long countByGuestSessionId(String guestSessionId);
}
