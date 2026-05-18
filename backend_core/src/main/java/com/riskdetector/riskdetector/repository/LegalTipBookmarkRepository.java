package com.riskdetector.riskdetector.repository;

import com.riskdetector.riskdetector.entity.LegalTipBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LegalTipBookmarkRepository extends JpaRepository<LegalTipBookmark, Long> {

    Optional<LegalTipBookmark> findByTipIdAndUserEmail(Long tipId, String email);

    Optional<LegalTipBookmark> findByTipIdAndGuestSessionId(Long tipId, String guestSessionId);

    @Query("""
            select b.tip.id from LegalTipBookmark b
            where b.tip.id in :tipIds and b.user.email = :email
            """)
    List<Long> findBookmarkedTipIdsByUserEmail(
            @Param("tipIds") Collection<Long> tipIds,
            @Param("email") String email);

    @Query("""
            select b.tip.id from LegalTipBookmark b
            where b.tip.id in :tipIds and b.guestSessionId = :guestSessionId
            """)
    List<Long> findBookmarkedTipIdsByGuestSessionId(
            @Param("tipIds") Collection<Long> tipIds,
            @Param("guestSessionId") String guestSessionId);

    long countByUserEmail(String email);

    long countByGuestSessionId(String guestSessionId);
}
