package com.escrow.engine.audit.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id,
        String action,
        Long performedById,
        Long walletId,
        Long escrowTransactionId,
        BigDecimal previousBalance,
        BigDecimal newBalance,
        String details,
        LocalDateTime timestamp
) {}