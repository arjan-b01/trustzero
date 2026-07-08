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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class DisputeArbitrationService {

    private final FireworksClient fireworksClient;
    private final EscrowService escrowService;
    private final EscrowRepository escrowRepository;
    private final DisputeRecordRepository disputeRecordRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final TransactionTemplate transactionTemplate;

    // Instantiated directly to bypass dependency injection overhead for this specific class
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DisputeArbitrationService(
            FireworksClient fireworksClient,
            @Lazy EscrowService escrowService,
            EscrowRepository escrowRepository,
            DisputeRecordRepository disputeRecordRepository,
            UserRepository userRepository,
            AuditLogService auditLogService,
            TransactionTemplate transactionTemplate) {

        this.fireworksClient = fireworksClient;
        this.escrowService = escrowService;
        this.escrowRepository = escrowRepository;
        this.disputeRecordRepository = disputeRecordRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.transactionTemplate = transactionTemplate;
    }

    private String upper(String s) {
        return s == null ? "" : s.trim().toUpperCase();
    }

    private static final String EVIDENCE_ANALYST_SYSTEM = "You are an Evidence Analyst. Review the dispute claims and evidence URLs. Assess what the evidence actually proves. Return ONLY valid JSON: { \"evidenceStrength\": \"STRONG\"|\"MODERATE\"|\"WEAK\"|\"NONE\", \"evidenceSupports\": \"BUYER\"|\"SELLER\"|\"NEITHER\", \"caseClarity\": \"CLEAR\"|\"AMBIGUOUS\", \"evidenceSummary\": \"brief summary of what the URLs show\" }";
    private static final String BUYER_ADVOCATE_SYSTEM = "You are the Buyer Advocate. Argue why funds should be REFUNDED to the buyer based on the dispute details and the Evidence Analyst's report. Return plain text only.";
    private static final String SELLER_ADVOCATE_SYSTEM = "You are the Seller Advocate. Argue why funds should be RELEASED to the seller based on the dispute details and the Evidence Analyst's report. Return plain text only.";
    private static final String ARBITRATOR_SYSTEM = "You are a neutral Arbitrator. Evaluate the dispute, the evidence report, and both advocate arguments. Output ONLY valid JSON: { \"verdict\": \"RELEASE\"|\"REFUND\", \"reasoning\": \"explanation\" }";

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

        // ==========================================
        // AGENT 0: THE EVIDENCE ANALYST
        // ==========================================
        String evidenceContext = "Buyer Claim: " + record.getBuyerClaim() + "\nBuyer Evidence URL: " + record.getBuyerEvidenceUrl() +
                "\nSeller Response: " + record.getSellerResponse() + "\nSeller Evidence URL: " + record.getSellerEvidenceUrl();

        String analystRaw = fireworksClient.call(EVIDENCE_ANALYST_SYSTEM, evidenceContext);

        String evidenceStrength = "NONE";
        String evidenceSupports = "NEITHER";
        String caseClarity = "AMBIGUOUS";
        String evidenceSummary = "Failed to analyze evidence.";

        try {
            JsonNode analystJson = parseJsonObject(analystRaw);
            evidenceStrength = upper(analystJson.path("evidenceStrength").asText("NONE"));
            evidenceSupports = upper(analystJson.path("evidenceSupports").asText("NEITHER"));
            caseClarity      = upper(analystJson.path("caseClarity").asText("AMBIGUOUS"));
            evidenceSummary = analystJson.path("evidenceSummary").asText("No summary provided.");
        } catch (Exception e) {
            System.err.println("Agent 0 JSON Parsing failed. Defaulting to NONE.");
        }

        // ==========================================
        // AGENTS 1 & 2: THE ADVOCATES
        // ==========================================
        String disputeContext = buildContext(tx, record, evidenceSummary);
        String buyerArgument = fireworksClient.call(BUYER_ADVOCATE_SYSTEM, disputeContext);
        String sellerArgument = fireworksClient.call(SELLER_ADVOCATE_SYSTEM, disputeContext);

        // ==========================================
        // AGENT 3: THE ARBITRATOR
        // ==========================================
        String arbitratorInput = disputeContext + "\n\n=== BUYER ADVOCATE ===\n" + buyerArgument + "\n\n=== SELLER ADVOCATE ===\n" + sellerArgument;
        String arbitratorRaw = fireworksClient.call(ARBITRATOR_SYSTEM, arbitratorInput);

        String verdict = "REFUND";
        String reasoning = "";

        try {
            String cleanArbJson = arbitratorRaw.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode arbJson = objectMapper.readTree(cleanArbJson);
            verdict = upper(arbJson.path("verdict").asText("REFUND"));
            reasoning = arbJson.path("reasoning").asText("No reasoning provided.");
        } catch (Exception e) {
            reasoning = "Failed to parse Arbitrator JSON. Manual review required. Raw: " + arbitratorRaw;
        }

        // ==========================================
        // THE CONFIDENCE ENGINE
        // ==========================================
        double confidenceScore = 0.40;
        boolean strongEvidence = evidenceStrength.equals("STRONG");
        boolean moderateEvidence = evidenceStrength.equals("MODERATE");
        boolean clearCase = caseClarity.equals("CLEAR");

        if (strongEvidence && clearCase) {
            confidenceScore = 0.92;
        } else if (strongEvidence) {
            confidenceScore = 0.75;
        } else if (moderateEvidence && clearCase) {
            confidenceScore = 0.72;
        } else if (moderateEvidence) {
            confidenceScore = 0.60;
        } else if (clearCase) {
            confidenceScore = 0.55;
        } else {
            confidenceScore = 0.40;
        }

        // Reassigning to final variables for the lambda scope below
        final String finalEvidenceStrength = evidenceStrength;
        final String finalEvidenceSupports = evidenceSupports;
        final String finalCaseClarity = caseClarity;
        final String finalEvidenceSummary = evidenceSummary;
        final String finalVerdict = verdict;
        final String finalReasoning = reasoning;
        final double finalConfidenceScore = confidenceScore;
        final String finalBuyerArgument = buyerArgument;
        final String finalSellerArgument = sellerArgument;

        // ==========================================
        // PROGRAMMATIC TRANSACTION BOUNDARY
        // ==========================================
        return transactionTemplate.execute(status -> {
            record.setAiEvidenceStrength(finalEvidenceStrength);
            record.setAiEvidenceSupports(finalEvidenceSupports);
            record.setAiCaseClarity(finalCaseClarity);
            record.setAiEvidenceAnalysis(finalEvidenceSummary);
            record.setAiBuyerArgument(finalBuyerArgument);
            record.setAiSellerArgument(finalSellerArgument);
            record.setAiReasoning(finalReasoning);
            record.setAiConfidenceScore(finalConfidenceScore);
            record.setAiRecommendedVerdict(finalVerdict);

            boolean isAutoExecuted = false;

            if (finalConfidenceScore >= 0.75) {
                record.setAutoExecuted(true);
                escrowService.resolveDisputeByAI(escrowId, finalVerdict, finalReasoning);

                auditLogService.logArbitrationEvent("AI-DECIDED", escrowId, admin.getId(),
                        "AI auto-executed: " + finalVerdict + " (Confidence: " + finalConfidenceScore + ")");
                isAutoExecuted = true;
            } else {
                auditLogService.logArbitrationEvent("AI-ESCALATED", escrowId, admin.getId(),
                        "AI recommended: " + finalVerdict + " (Confidence: " + finalConfidenceScore + ") - Escalated due to weak evidence.");
            }

            disputeRecordRepository.save(record);

            return new ArbitrationResult(
                    finalVerdict,
                    finalConfidenceScore,
                    true,
                    true,
                    finalEvidenceSupports,
                    finalBuyerArgument,
                    finalSellerArgument,
                    finalReasoning,
                    isAutoExecuted
            );
        });
    }

    private String buildContext(EscrowTransaction tx, DisputeRecord record, String evidenceSummary) {
        return "Escrow Title: " + tx.getTitle() + "\nAmount: " + tx.getAmount() +
                "\nTerms: " + record.getAgreedDeliveryTerms() +
                "\nBuyer Claim: " + record.getBuyerClaim() +
                "\nSeller Response: " + (record.getSellerResponse() != null ? record.getSellerResponse() : "None") +
                "\n\n--- EVIDENCE ANALYST REPORT ---\n" + evidenceSummary;
    }

    private static final java.util.regex.Pattern JSON_BLOCK =
            java.util.regex.Pattern.compile("\\{.*}", java.util.regex.Pattern.DOTALL);

    private JsonNode parseJsonObject(String raw) throws Exception {
        if (raw == null || raw.isBlank()) throw new IllegalArgumentException("Empty response");
        String cleaned = raw.replaceAll("```json", "").replaceAll("```", "").trim();
        java.util.regex.Matcher m = JSON_BLOCK.matcher(cleaned);
        if (!m.find()) throw new IllegalArgumentException("No JSON object found");
        return objectMapper.readTree(m.group());
    }
}