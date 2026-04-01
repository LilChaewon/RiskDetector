package com.riskdetector.riskdetector.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(schema = "prod", name = "contract_analyses")
@Getter
@NoArgsConstructor
public class ContractAnalysis {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @Column(columnDefinition = "TEXT")
    private String summary;

    private String status; // 'success', 'error'

    @Column(name = "process_status")
    private String processStatus; // 'IN_PROGRESS', 'COMPLETED', 'FAILED'

    @Column(name = "ddobak_overall_comment", columnDefinition = "TEXT")
    private String ddobakOverallComment;

    @Column(name = "ddobak_warning_comment", columnDefinition = "TEXT")
    private String ddobakWarningComment;

    @Column(name = "ddobak_advice", columnDefinition = "TEXT")
    private String ddobakAdvice;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public ContractAnalysis(String id, Contract contract, String summary, String status,
                            String processStatus, String ddobakOverallComment,
                            String ddobakWarningComment, String ddobakAdvice) {
        this.id = id;
        this.contract = contract;
        this.summary = summary;
        this.status = status;
        this.processStatus = processStatus;
        this.ddobakOverallComment = ddobakOverallComment;
        this.ddobakWarningComment = ddobakWarningComment;
        this.ddobakAdvice = ddobakAdvice;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
