package com.escrow.engine.escrow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DisputeRequest(
        @NotBlank(message = "Dispute reason is required")
        @Size(min = 10, max = 1000, message = "Reason must be between 10 and 1000 characters to ensure sufficient detail")
        String reason
) {}
