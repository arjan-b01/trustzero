package com.escrow.engine.arbitration.service;
import com.escrow.engine.dispute.entity.Evidence;
import com.escrow.engine.dispute.repository.EvidenceRepository;
import com.escrow.engine.arbitration.client.EvidenceFetcher;
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
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

@Service
public class DisputeArbitrationService {

    private final FireworksClient fireworksClient;
    private final EscrowService escrowService;
    private final EscrowRepository escrowRepository;
    private final DisputeRecordRepository disputeRecordRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final EvidenceFetcher evidenceFetcher;
    private final TransactionTemplate transactionTemplate;
    private final ObjectMapper objectMapper;
    private final EvidenceRepository evidenceRepository;

    public DisputeArbitrationService(
            FireworksClient fireworksClient,
            @Lazy EscrowService escrowService,
            EscrowRepository escrowRepository,
            DisputeRecordRepository disputeRecordRepository,
            UserRepository userRepository,
            AuditLogService auditLogService,
            TransactionTemplate transactionTemplate,
            EvidenceFetcher evidenceFetcher,
            ObjectMapper objectMapper,
            EvidenceRepository evidenceRepository) {

        this.fireworksClient = fireworksClient;
        this.escrowService = escrowService;
        this.escrowRepository = escrowRepository;
        this.disputeRecordRepository = disputeRecordRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.transactionTemplate = transactionTemplate;
        this.evidenceFetcher = evidenceFetcher;
        this.objectMapper = objectMapper;
        this.evidenceRepository = evidenceRepository;
    }

    private String upper(String s) {
        return s == null ? "" : s.trim().toUpperCase();
    }

    private static final String EVIDENCE_ANALYST_SYSTEM = """
    You are an Evidence Analyst for an escrow dispute resolution system.
    You will receive:
    - The buyer's claim
    - The seller's response
    - FETCHED CONTENT from evidence URLs (actual text extracted from web pages,
      or notes indicating the URL is an image/video that needs separate analysis)

    Evaluate ONLY the fetched content. Ignore claims that have no supporting evidence.

    Return ONLY valid JSON (no markdown, no conversational text) with this exact shape:
    {
      "evidenceStrength": "STRONG" | "MODERATE" | "WEAK" | "NONE",
      "evidenceSupports": "BUYER" | "SELLER" | "NEITHER",
      "caseClarity": "CLEAR" | "AMBIGUOUS",
      "evidenceSummary": "what the evidence proves",
      "keyFindings": ["finding 1", "finding 2"],
      "contradictions": ["contradiction 1"]
    }

    Definitions:
    - STRONG: Documentary proof (tracking shows delivered, photo shows item working,
              fetched text confirms key claim)
    - MODERATE: Circumstantial evidence (communication logs, partial documentation)
    - WEAK: Claims without supporting documents
    - NONE: No verifiable evidence at all, or all URLs failed to fetch

    If evidence URLs failed to fetch or are images you cannot analyze, set
    evidenceStrength to NONE or WEAK depending on whether text evidence exists.
    """;
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

        if (record.getSellerResponse() == null || record.getSellerResponse().isBlank()) {
            throw new IllegalStateException(
                    "Cannot arbitrate: the seller has not yet submitted a response.");
        }

        // ==========================================
        // AGENT 0: THE EVIDENCE ANALYST
        // ==========================================
        EvidenceFetcher.FetchedEvidence buyerFetched = evidenceFetcher.fetch(record.getBuyerEvidenceUrl());
        EvidenceFetcher.FetchedEvidence sellerFetched = evidenceFetcher.fetch(record.getSellerEvidenceUrl());

        List<Evidence> buyerImageEvidence = evidenceRepository.findByEscrowIdAndPartyOrderByUploadedAtAsc(escrowId, "BUYER");
        List<Evidence> sellerImageEvidence = evidenceRepository.findByEscrowIdAndPartyOrderByUploadedAtAsc(escrowId, "SELLER");

        String buyerImageAnalyses = buyerImageEvidence.isEmpty()
                ? "No image evidence uploaded."
                : formatImageEvidence(buyerImageEvidence);

        String sellerImageAnalyses = sellerImageEvidence.isEmpty()
                ? "No image evidence uploaded."
                : formatImageEvidence(sellerImageEvidence);

        String evidenceContext = "Buyer Claim: " + record.getBuyerClaim() +
                "\n\nBuyer Evidence URL: " + record.getBuyerEvidenceUrl() +
                "\nBuyer Evidence Fetched Content:\n" + buyerFetched.getContent() +
                "\n\nBuyer Image Evidence (analyzed by Vision Model):\n" + buyerImageAnalyses +
                "\n\nSeller Response: " + record.getSellerResponse() +
                "\n\nSeller Evidence URL: " + record.getSellerEvidenceUrl() +
                "\nSeller Evidence Fetched Content:\n" + sellerFetched.getContent() +
                "\n\nSeller Image Evidence (analyzed by Vision Model):\n" + sellerImageAnalyses;

        // CALL AGENT 0
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
            JsonNode arbJson = parseJsonObject(arbitratorRaw);
            verdict = upper(arbJson.path("verdict").asText("REFUND"));
            reasoning = arbJson.path("reasoning").asText("No reasoning provided.");
        } catch (Exception e) {
            reasoning = "Failed to parse Arbitrator JSON. Manual review required. Raw: " + arbitratorRaw;
        }

// ==========================================
// MULTI-FACTOR CONFIDENCE ENGINE
// ==========================================
// Previously: confidence = f(evidenceStrength, caseClarity)
//   → only 2 binary inputs → most cases landed on 0.40
// Now: weighted score across 5 factors
        boolean strongEvidence   = "STRONG".equals(evidenceStrength);
        boolean moderateEvidence = "MODERATE".equals(evidenceStrength);
        boolean clearCase        = "CLEAR".equals(caseClarity);

// Factor 3: Evidence-Verdict Corroboration
// Does the evidence support the same party the verdict favors?
        boolean evidenceCorroboratesVerdict =
                ("BUYER".equals(evidenceSupports)  && "REFUND".equals(verdict))
                        || ("SELLER".equals(evidenceSupports) && "RELEASE".equals(verdict));

// Factor 4: Advocate Convergence
// Did both advocates acknowledge the same core facts? Approximate by checking
// if both arguments mention the evidence summary terms.
        boolean advocatesConverged = argumentsShareFacts(buyerArgument, sellerArgument, evidenceSummary);

// Factor 5: Arbitrator Certainty
// Does the reasoning use hedging language ("likely", "probably", "appears")?
        boolean arbitratorCertain = !containsHedging(reasoning);

        double confidenceScore = 0.30; // baseline
        if (strongEvidence)                     confidenceScore += 0.25;
        else if (moderateEvidence)              confidenceScore += 0.15;
        if (clearCase)                          confidenceScore += 0.15;
        if (evidenceCorroboratesVerdict)        confidenceScore += 0.15;
        if (advocatesConverged)                 confidenceScore += 0.10;
        if (arbitratorCertain)                  confidenceScore += 0.05;
// Cap at 0.95 — never claim 100% certainty
        confidenceScore = Math.min(confidenceScore, 0.95);

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

    /**
     * Checks if both advocate arguments reference terms from the evidence summary.
     * Crude heuristic: if both arguments mention 2+ keywords from the summary,
     * they're engaging with the same facts.
     */
    private boolean argumentsShareFacts(String buyerArg, String sellerArg, String summary) {
        if (summary == null || summary.length() < 20) return false;
        // Extract meaningful words from summary (length > 5 to skip filler)
        String[] summaryWords = summary.toLowerCase()
                .replaceAll("[^a-z0-9 ]", " ")
                .split("\\s+");
        java.util.Set<String> keywords = new java.util.HashSet<>();
        for (String w : summaryWords) {
            if (w.length() > 5) keywords.add(w);
        }
        if (keywords.size() < 2) return false;

        String buyerLower = buyerArg.toLowerCase();
        String sellerLower = sellerArg.toLowerCase();
        long buyerMatches = keywords.stream().filter(buyerLower::contains).count();
        long sellerMatches = keywords.stream().filter(sellerLower::contains).count();

        return buyerMatches >= 2 && sellerMatches >= 2;
    }

    /**
     * Detects hedging language in the arbitrator's reasoning.
     * If the arbitrator is uncertain, they use words like "likely", "probably".
     */
    private boolean containsHedging(String text) {
        if (text == null) return true;
        String lower = text.toLowerCase();
        String[] hedges = {"likely", "probably", "appears", "seems", "possibly",
                "might", "could", "unclear", "uncertain", "ambiguous",
                "i think", "i believe", "perhaps"};
        for (String h : hedges) {
            if (lower.contains(h)) return true;
        }
        return false;
    }

    /**
     * Formats image evidence records into a readable summary for the Evidence Analyst.
     * Each image's VLM analysis is included so the text-based analyst can "see" what
     * the images show.
     */
    private String formatImageEvidence(List<Evidence> evidenceList) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < evidenceList.size(); i++) {
            Evidence e = evidenceList.get(i);
            sb.append("  Image ").append(i + 1).append(": ").append(e.getFileName())
                    .append(" (").append(e.getFileType()).append(")\n");
            sb.append("  Vision Model Analysis: ").append(e.getVlmAnalysis()).append("\n\n");
        }
        return sb.toString();
    }
}