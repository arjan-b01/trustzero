package com.escrow.engine.dispute.entity;

import com.escrow.engine.escrow.entity.EscrowTransaction;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

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

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escrow_id", nullable = false, unique = true)
    private EscrowTransaction escrow;

    // --- User Provided Evidence ---
    @Column(nullable = false, columnDefinition = "TEXT")
    private String buyerClaim;

    @Column(length = 1000)
    private String sellerResponse;

    private boolean deliveryProofSubmitted;

    private boolean deadlineMet;

    @Column(length = 500)
    private String evidenceUrl;

    @Column(nullable = false, length = 500)
    private String agreedDeliveryTerms;

    // --- AI Generated Arbitration Data ---
    @Column(columnDefinition = "TEXT")
    private String aiBuyerArgument;

    @Column(columnDefinition = "TEXT")
    private String aiSellerArgument;

    @Column(columnDefinition = "TEXT")
    private String aiReasoning;

    private Double aiConfidenceScore;

    private String aiRecommendedVerdict;

    private boolean autoExecuted;

    @CreationTimestamp
    private LocalDateTime createdAt;
}