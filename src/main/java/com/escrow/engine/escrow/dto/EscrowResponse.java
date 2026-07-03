package com.escrow.engine.escrow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EscrowResponse(
        Long id,
        String title,
        String description,
        BigDecimal amount,
        BigDecimal platformFee,
        BigDecimal lockedAmount,
        BigDecimal commissionRate,
        String status,
        Long buyerId,
        String buyerName,
        Long sellerId,
        String sellerName,
        String disputeReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}