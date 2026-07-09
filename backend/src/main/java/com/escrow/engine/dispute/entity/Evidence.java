package com.escrow.engine.dispute.entity;

import com.escrow.engine.escrow.entity.EscrowTransaction;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "evidence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escrow_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private EscrowTransaction escrow;

    @Column(nullable = false, length = 20)
    private String party;          // "BUYER" or "SELLER"

    @Column(nullable = false, length = 50)
    private String fileType;       // "image/jpeg", "video/mp4", "application/pdf"

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileUrl;        // /api/evidence/files/{filename}

    @Column(columnDefinition = "TEXT")
    private String vlmAnalysis;    // Vision model's description of the image

    @Column(length = 20)
    private String analysisStatus; // "PENDING", "ANALYZED", "FAILED"

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;
}