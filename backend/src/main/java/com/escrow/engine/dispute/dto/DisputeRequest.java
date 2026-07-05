package com.escrow.engine.dispute.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DisputeRequest(
        @NotBlank(message = "Buyer claim is required")
        @Size(min = 10, message = "Claim must be at least 10 characters")
        String buyerClaim,

        @NotBlank(message = "Agreed delivery terms are required for context")
        String agreedDeliveryTerms,

        String buyerEvidenceUrl
) {}