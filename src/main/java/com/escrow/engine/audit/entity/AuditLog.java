package com.escrow.engine.audit.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private String action;

    @Column(nullable = false, updatable = false)
    private Long performedById;

    @Column(nullable = false, updatable = false)
    private Long walletId;

    @Column(updatable = false)
    private Long escrowTransactionId;

    @Column(precision = 15, scale = 2, updatable = false)
    private BigDecimal previousBalance;

    @Column(precision = 15, scale = 2, updatable = false)
    private BigDecimal newBalance;

    @Column(length = 2000, updatable = false)
    private String details;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;
}