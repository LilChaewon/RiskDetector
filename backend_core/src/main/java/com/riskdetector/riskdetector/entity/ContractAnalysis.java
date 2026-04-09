package com.riskdetector.riskdetector.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "contract_analyses")
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

    @Column(name = "riskdetector_overall_comment", columnDefinition = "TEXT")
    private String riskdetectorOverallComment;

    @Column(name = "riskdetector_warning_comment", columnDefinition = "TEXT")
    private String riskdetectorWarningComment;

    @Column(name = "riskdetector_advice", columnDefinition = "TEXT")
    private String riskdetectorAdvice;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public ContractAnalysis(String id, Contract contract, String summary, String status,
                            String processStatus, String riskdetectorOverallComment,
                            String riskdetectorWarningComment, String riskdetectorAdvice) {
        this.id = id;
        this.contract = contract;
        this.summary = summary;
        this.status = status;
        this.processStatus = processStatus;
        this.riskdetectorOverallComment = riskdetectorOverallComment;
        this.riskdetectorWarningComment = riskdetectorWarningComment;
        this.riskdetectorAdvice = riskdetectorAdvice;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void complete(String summary, String riskdetectorOverallComment,
                         String riskdetectorWarningComment, String riskdetectorAdvice) {
        this.processStatus = "COMPLETED";
        this.summary = summary;
        this.riskdetectorOverallComment = riskdetectorOverallComment;
        this.riskdetectorWarningComment = riskdetectorWarningComment;
        this.riskdetectorAdvice = riskdetectorAdvice;
        this.updatedAt = LocalDateTime.now();
    }
}
