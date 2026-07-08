import api from './api';
import { updateLocalEscrowStatus } from '../utils/storage';

const disputeService = {
  // Trigger AI Arbitration (Admin only)
  async arbitrate(userEmail, escrowId) {
    const response = await api.post(`/escrow/${escrowId}/arbitrate`);
    const data = response.data;
    
    const finalStatus = data.autoExecuted ? (data.verdict === 'RELEASE' ? 'RELEASED' : 'REFUNDED') : 'DISPUTED';
    const disputeReason = data.autoExecuted 
      ? `AI-RESOLVED: ${data.arbitratorReasoning}`
      : `AI-ESCALATED: AI recommended ${data.verdict} (Confidence: ${data.confidenceScore})`;

    // Sync AI arbitration results in local storage
    updateLocalEscrowStatus(userEmail, escrowId, finalStatus, {
      disputeReason: disputeReason,
      aiRecommendedVerdict: data.verdict,
      aiConfidenceScore: data.confidenceScore,
      aiBuyerArgument: data.buyerArgument,
      aiSellerArgument: data.sellerArgument,
      aiReasoning: data.arbitratorReasoning,
      autoExecuted: data.autoExecuted
    });
    
    return data;
  }
};

export default disputeService;
