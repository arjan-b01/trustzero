package com.escrow.engine.dispute.dto;

import java.time.LocalDateTime;

public record DisputeRecordResponse(
        Long id,
        Long escrowId,
        String buyerClaim,
        String sellerResponse,
        String agreedDeliveryTerms,
        String buyerEvidenceUrl,
        String sellerEvidenceUrl,
        String aiEvidenceStrength,
        String aiEvidenceSupports,
        String aiCaseClarity,
        String aiEvidenceAnalysis,
        String aiBuyerArgument,
        String aiSellerArgument,
        String aiReasoning,
        Double aiConfidenceScore,
        String aiRecommendedVerdict,
        boolean autoExecuted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
