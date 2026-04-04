package com.riskdetector.riskdetector.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(schema = "prod", name = "ocr_content")
@Getter
@NoArgsConstructor
public class OcrContent {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String category;

    @Column(name = "tag_idx")
    private Integer tagIdx; // 정렬용 인덱스

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Builder
    public OcrContent(String id, Contract contract, String content, String category, Integer tagIdx) {
        this.id = id;
        this.contract = contract;
        this.content = content;
        this.category = category;
        this.tagIdx = tagIdx;
        this.createdAt = LocalDateTime.now();
    }
}
