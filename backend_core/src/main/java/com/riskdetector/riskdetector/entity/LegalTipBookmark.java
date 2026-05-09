package com.riskdetector.riskdetector.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "legal_tip_bookmarks")
@Getter
@NoArgsConstructor
public class LegalTipBookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tip_id", nullable = false)
    private LegalTip tip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "guest_session_id")
    private String guestSessionId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Builder
    public LegalTipBookmark(LegalTip tip, User user, String guestSessionId) {
        this.tip = tip;
        this.user = user;
        this.guestSessionId = guestSessionId;
        this.createdAt = LocalDateTime.now();
    }
}
