package com.escrow.engine.arbitration.service;

import com.escrow.engine.arbitration.client.FireworksClient;
import com.escrow.engine.arbitration.dto.ArbitrationResult;
import com.escrow.engine.audit.service.AuditLogService;
import com.escrow.engine.common.exception.ResourceNotFoundException;
import com.escrow.engine.dispute.entity.DisputeRecord;
import com.escrow.engine.escrow.entity.EscrowTransaction;
import com.escrow.engine.dispute.repository.DisputeRecordRepository;
import com.escrow.engine.escrow.repository.EscrowRepository;
import com.escrow.engine.escrow.service.EscrowService;
import com.escrow.engine.user.entity.User;
import com.escrow.engine.user.enums.UserRole;
import com.escrow.engine.user.repository.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DisputeArbitrationService {

    private final FireworksClient fireworksClient;
    private final EscrowService escrowService;
    private final EscrowRepository escrowRepository;
    private final DisputeRecordRepository disputeRecordRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public DisputeArbitrationService(
            FireworksClient fireworksClient,
            @Lazy EscrowService escrowService,
            EscrowRepository escrowRepository,
            DisputeRecordRepository disputeRecordRepository,
            UserRepository userRepository,
            AuditLogService auditLogService,
            ObjectMapper objectMapper) {
        this.fireworksClient = fireworksClient;
        this.escrowService = escrowService;
        this.escrowRepository = escrowRepository;
        this.disputeRecordRepository = disputeRecordRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    private static final String BUYER_ADVOCATE_SYSTEM = "You are the Buyer Advocate. Argue why funds should be REFUNDED to the buyer based on the dispute details. Return plain text only.";
    private static final String SELLER_ADVOCATE_SYSTEM = "You are the Seller Advocate. Argue why funds should be RELEASED to the seller based on the dispute details. Return plain text only.";
    private static final String ARBITRATOR_SYSTEM = "You are a neutral Arbitrator. Evaluate the dispute details and both advocate arguments. Output ONLY valid JSON, no markdown: { \"verdict\": \"RELEASE\"|\"REFUND\", \"evidenceSubmitted\": true|false, \"agentsAgree\": true|false, \"clearerParty\": \"BUYER\"|\"SELLER\"|\"NEITHER\", \"reasoning\": \"explanation\" }";

    @Transactional
    public ArbitrationResult arbitrate(Long escrowId, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("Unauthorized: Only ADMIN can trigger arbitration");
        }

        EscrowTransaction tx = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow not found"));

        if (!tx.getStatus().name().equals("DISPUTED")) {
            throw new IllegalStateException("Arbitration can only run on DISPUTED escrows.");
        }

        DisputeRecord record = disputeRecordRepository.findByEscrowId(escrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute data not found"));

        String disputeContext = buildContext(tx, record);

        // 1. Agent Advocates
        String buyerArgument = fireworksClient.call(BUYER_ADVOCATE_SYSTEM, disputeContext);
        String sellerArgument = fireworksClient.call(SELLER_ADVOCATE_SYSTEM, disputeContext);

        // 2. Arbitrator
        String arbitratorInput = disputeContext + "\n\n=== BUYER ===\n" + buyerArgument + "\n\n=== SELLER ===\n" + sellerArgument;
        String arbitratorRaw = fireworksClient.call(ARBITRATOR_SYSTEM, arbitratorInput);

        // 3. Parse JSON & Calculate Score
        String verdict = "REFUND";
        String reasoning;
        double confidenceScore = 0.45;
        boolean evidenceSubmitted = false, agentsAgree = false;
        String clearerParty = "NEITHER";

        try {
            String cleanJson = arbitratorRaw.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode json = objectMapper.readTree(cleanJson);
            verdict = json.path("verdict").asText("REFUND");
            evidenceSubmitted = json.path("evidenceSubmitted").asBoolean(false);
            agentsAgree = json.path("agentsAgree").asBoolean(false);
            clearerParty = json.path("clearerParty").asText("NEITHER");
            reasoning = json.path("reasoning").asText();

            // Deterministic logic
            if (evidenceSubmitted && agentsAgree) confidenceScore = 0.90;
            else if (evidenceSubmitted) confidenceScore = 0.65;
            else if (agentsAgree) confidenceScore = 0.70;

        } catch (Exception e) {
            reasoning = "Failed to parse AI output. Manual review required. Raw: " + arbitratorRaw;
        }

        // 4. Save AI Thoughts
        record.setAiBuyerArgument(buyerArgument);
        record.setAiSellerArgument(sellerArgument);
        record.setAiReasoning(reasoning);
        record.setAiConfidenceScore(confidenceScore);
        record.setAiRecommendedVerdict(verdict);

        boolean autoExecuted = false;

        // 5. Execution Threshold
        if (confidenceScore >= 0.75) {
            record.setAutoExecuted(true);
            escrowService.resolveDisputeByAI(escrowId, verdict, reasoning);

            // You will need to add logArbitrationEvent to AuditLogService in the next step
            auditLogService.logArbitrationEvent("AI-DECIDED", escrowId, admin.getId(),
                    "AI auto-executed: " + verdict + " (Confidence: " + confidenceScore + ")");
            autoExecuted = true;
        } else {
            auditLogService.logArbitrationEvent("AI-ESCALATED", escrowId, admin.getId(),
                    "AI recommended: " + verdict + " (Confidence: " + confidenceScore + ") - Escalated to Admin.");
        }

        disputeRecordRepository.save(record);

        return new ArbitrationResult(verdict, confidenceScore, evidenceSubmitted, agentsAgree, clearerParty, buyerArgument, sellerArgument, reasoning, autoExecuted);
    }

    private String buildContext(EscrowTransaction tx, DisputeRecord record) {
        return "Escrow Title: " + tx.getTitle() + "\nAmount: " + tx.getAmount() +
                "\nTerms: " + record.getAgreedDeliveryTerms() +
                "\nBuyer Claim: " + record.getBuyerClaim() +
                "\nSeller Response: " + (record.getSellerResponse() != null ? record.getSellerResponse() : "None") +
                "\nDelivery Proof: " + record.isDeliveryProofSubmitted() +
                "\nDeadline Met: " + record.isDeadlineMet();
    }
}