package com.escrow.engine.escrow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateEscrowRequest(
        @NotBlank(message = "Title is required")
        String title,

        String description,

        @NotNull(message = "Seller ID is required")
        Long sellerId,

        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be strictly greater than zero")
        BigDecimal amount
) {
}
