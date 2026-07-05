package com.escrow.engine.dispute.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SellerResponseRequest (
        @NotBlank(message = "Seller response cannot be blank")
        @Size(min = 10, message = "seller resopnse must be atleast 10 characters")
        String sellerResponse,

        String sellerEvidenceUrl
){}