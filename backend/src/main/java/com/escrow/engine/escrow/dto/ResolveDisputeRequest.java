package com.escrow.engine.escrow.dto;

import com.escrow.engine.escrow.enums.DisputeResolution;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResolveDisputeRequest(
        @NotNull(message = "Resolution decision is required")
        DisputeResolution resolution,

        @NotBlank(message = "Admin notes are required to legally justify this resolution")
        String adminNotes
) {}
