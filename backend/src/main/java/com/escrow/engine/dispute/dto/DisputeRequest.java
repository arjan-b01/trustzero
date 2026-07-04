package com.escrow.engine.dispute.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DisputeRequest(
        @NotBlank(message = "Buyer claim is required")
        @Size(min = 10, max = 1000, message = "Claim must be between 10 and 1000 characters")
        String buyerClaim,

        String sellerResponse, // Optional initially

        boolean deliveryProofSubmitted,

        boolean deadlineMet,

        String evidenceUrl,

        @NotBlank(message = "Agreed delivery terms are required for context")
        String agreedDeliveryTerms
) {}