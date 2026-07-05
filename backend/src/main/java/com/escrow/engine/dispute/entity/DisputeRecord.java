package com.escrow.engine.dispute.entity;

import com.escrow.engine.escrow.entity.EscrowTransaction;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "dispute_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Kept your exact JPA relationship mapping intact
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escrow_id", nullable = false, unique = true)
    private EscrowTransaction escrow;

    // --- Bilateral Claims & Metadata ---
    @Column(nullable = false, columnDefinition = "TEXT")
    private String buyerClaim;

    @Column(columnDefinition = "TEXT")
    private String sellerResponse;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String agreedDeliveryTerms;

    @Column(columnDefinition = "TEXT")
    private String buyerEvidenceUrl;

    @Column(columnDefinition = "TEXT")
    private String sellerEvidenceUrl;

    // --- NEW: AI-Assessed Structural Signals (Replaces the weak booleans) ---
    @Column(length = 50)
    private String aiEvidenceStrength; // e.g., STRONG, MODERATE, WEAK, NONE

    @Column(length = 50)
    private String aiEvidenceSupports; // e.g., BUYER, SELLER, NEITHER, UNCLEAR

    @Column(length = 50)
    private String aiCaseClarity;      // e.g., CLEAR, AMBIGUOUS

    // --- Heavy AI Text Fields ---
    @Column(columnDefinition = "TEXT")
    private String aiEvidenceAnalysis; // Out of Agent 0

    @Column(columnDefinition = "TEXT")
    private String aiBuyerArgument;

    @Column(columnDefinition = "TEXT")
    private String aiSellerArgument;

    @Column(columnDefinition = "TEXT")
    private String aiReasoning;

    private Double aiConfidenceScore;

    @Column(length = 50)
    private String aiRecommendedVerdict;

    private boolean autoExecuted;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}