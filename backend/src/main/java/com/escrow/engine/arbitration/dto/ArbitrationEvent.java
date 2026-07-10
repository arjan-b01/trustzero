package com.escrow.engine.arbitration.dto;

/**
 * Represents a single event in the arbitration stream.
 * Sent to the frontend via Server-Sent Events.
 */
public record ArbitrationEvent(
        String type,           // "agent_start", "agent_complete", "verdict", "error", "progress"
        String agent,          // "evidence_analyst", "buyer_advocate", "seller_advocate", "arbitrator"
        String message,        // human-readable status message
        Object data            // optional structured payload (agent results, verdict, etc.)
) {
    public static ArbitrationEvent agentStart(String agent) {
        String displayName = switch (agent) {
            case "evidence_analyst" -> "Evidence Analyst";
            case "buyer_advocate"   -> "Buyer Advocate";
            case "seller_advocate"  -> "Seller Advocate";
            case "arbitrator"       -> "Arbitrator";
            default -> agent;
        };
        return new ArbitrationEvent("agent_start", agent,
                displayName + " — analyzing", null);
    }

    public static ArbitrationEvent agentComplete(String agent, Object result) {
        String displayName = switch (agent) {
            case "evidence_analyst" -> "Evidence Analyst";
            case "buyer_advocate"   -> "Buyer Advocate";
            case "seller_advocate"  -> "Seller Advocate";
            case "arbitrator"       -> "Arbitrator";
            default -> agent;
        };
        return new ArbitrationEvent("agent_complete", agent,
                displayName + " — complete", result);
    }

    public static ArbitrationEvent verdict(String verdict, double confidence, String reasoning) {
        String verdictLabel = "REFUND".equals(verdict) ? "Refund to Buyer" : "Release to Seller";
        return new ArbitrationEvent("verdict", "arbitrator",
                "Verdict: " + verdictLabel + " (Confidence: " + confidence + ")",
                new VerdictData(verdict, confidence, reasoning));
    }

    public static ArbitrationEvent progress(String message) {
        return new ArbitrationEvent("progress", null, message, null);
    }

    public static ArbitrationEvent error(String message) {
        return new ArbitrationEvent("error", null, message, null);
    }

    public record VerdictData(String verdict, double confidence, String reasoning) {}
}