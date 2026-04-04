package com.riskdetector.riskdetector.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(schema = "prod", name = "toxic_clauses")
@Getter
@NoArgsConstructor
public class ToxicClause {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id")
    private ContractAnalysis analysis;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String clause;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "reason_reference", columnDefinition = "TEXT")
    private String reasonReference;

    @Column(name = "source_contract_tag_idx")
    private Integer sourceContractTagIdx;

    @Column(name = "warn_level")
    private Integer warnLevel; // 1(낮음) ~ 3(높음)

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Builder
    public ToxicClause(String id, ContractAnalysis analysis, String title, String clause,
                       String reason, String reasonReference, Integer sourceContractTagIdx, Integer warnLevel) {
        this.id = id;
        this.analysis = analysis;
        this.title = title;
        this.clause = clause;
        this.reason = reason;
        this.reasonReference = reasonReference;
        this.sourceContractTagIdx = sourceContractTagIdx;
        this.warnLevel = warnLevel;
        this.createdAt = LocalDateTime.now();
    }
}
