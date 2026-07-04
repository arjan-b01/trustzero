import api from './api';
import { updateLocalEscrowStatus } from '../utils/storage';

const disputeService = {
  // Trigger AI Arbitration (Admin only)
  async arbitrate(userEmail, escrowId) {
    const response = await api.post(`/escrow/${escrowId}/arbitrate`);
    const data = response.data;
    
    // If AI arbitration auto-executed, sync state in local storage
    if (data.autoExecuted) {
      const finalStatus = data.verdict === 'RELEASE' ? 'RELEASED' : 'REFUNDED';
      updateLocalEscrowStatus(userEmail, escrowId, finalStatus, {
        disputeReason: `AI-RESOLVED: ${data.reasoning}`
      });
    } else {
      updateLocalEscrowStatus(userEmail, escrowId, 'DISPUTED', {
        disputeReason: `AI-ESCALATED: AI recommended ${data.verdict} (Confidence: ${data.confidenceScore})`
      });
    }
    
    return data;
  }
};

export default disputeService;
