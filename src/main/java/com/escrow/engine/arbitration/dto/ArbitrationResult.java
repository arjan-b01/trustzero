package com.escrow.engine.arbitration.dto;

public record ArbitrationResult(
        String verdict,
        double confidenceScore,
        boolean evidenceSubmitted,
        boolean agentsAgree,
        String clearerParty,
        String buyerArgument,
        String sellerArgument,
        String arbitratorReasoning,
        boolean autoExecuted
) {}