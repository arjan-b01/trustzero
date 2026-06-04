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

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private Long perfomedById;

    @Column(nullable = false)
    private Long walletId;

    private Long escrowTransactionId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal previousBalance;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal newBalance;

    @Column(length = 2000)
    private String details;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;
}
