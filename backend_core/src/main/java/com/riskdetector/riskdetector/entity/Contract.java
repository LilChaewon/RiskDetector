package com.riskdetector.riskdetector.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(schema = "prod", name = "contracts")
@Getter
@NoArgsConstructor
public class Contract {

    @Id
    private String id; // UUID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String title;

    @Column(name = "contract_type")
    private String contractType; // RENTAL, EMPLOYMENT

    @Column(name = "s3_key_prefix")
    private String s3KeyPrefix;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Contract(String id, User user, String title, String contractType, String s3KeyPrefix) {
        this.id = id;
        this.user = user;
        this.title = title;
        this.contractType = contractType;
        this.s3KeyPrefix = s3KeyPrefix;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
