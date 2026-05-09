package com.riskdetector.riskdetector.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "legal_tips")
@Getter
@NoArgsConstructor
public class LegalTip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_id", nullable = false, unique = true)
    private String sourceId;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Column(name = "source_url", columnDefinition = "TEXT")
    private String sourceUrl;

    @Column(name = "view_count")
    private Long viewCount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public LegalTip(String sourceId, String category, String question, String answer, String sourceUrl, Long viewCount) {
        this.sourceId = sourceId;
        this.category = category;
        this.question = question;
        this.answer = answer;
        this.sourceUrl = sourceUrl;
        this.viewCount = viewCount == null ? 0L : viewCount;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null ? 0L : this.viewCount) + 1L;
        this.updatedAt = LocalDateTime.now();
    }
}
