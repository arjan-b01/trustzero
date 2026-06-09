package com.escrow.engine.wallet.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WalletResponse(
        Long walletId,
        BigDecimal balance,
        LocalDateTime updatedAt
) {}
