import api from './api';
import { getLocalEscrows, saveLocalEscrow, updateLocalEscrowStatus } from '../utils/storage';

const escrowService = {
  // Create Escrow
  async createEscrow(buyerEmail, requestData) {
    const response = await api.post('/escrow', {
      title: requestData.title,
      description: requestData.description,
      amount: Number(requestData.amount),
      sellerId: Number(requestData.sellerId)
    });
    
    // Save to local storage cache for listing
    saveLocalEscrow(buyerEmail, response.data);
    return response.data;
  },

  // Get Escrow details
  async getEscrowById(buyerEmail, id) {
    try {
      const response = await api.get(`/escrow/${id}`);
      // Sync local status
      updateLocalEscrowStatus(buyerEmail, id, response.data.status, response.data);
      return response.data;
    } catch (error) {
      // Fallback to local storage if it's one of the seeded mocks
      const localList = getLocalEscrows(buyerEmail);
      const matched = localList.find(e => e.id === Number(id));
      if (matched) {
        return matched;
      }
      throw error;
    }
  },

  // Fund Escrow
  async fundEscrow(buyerEmail, id) {
    const response = await api.post(`/escrow/${id}/fund`);
    updateLocalEscrowStatus(buyerEmail, id, 'FUNDED', response.data);
    return response.data;
  },

  // Release Funds
  async releaseFunds(buyerEmail, id) {
    const response = await api.post(`/escrow/${id}/release`);
    updateLocalEscrowStatus(buyerEmail, id, 'RELEASED', response.data);
    return response.data;
  },

  // Open Dispute
  async openDispute(userEmail, id, claimData) {
    const response = await api.post(`/escrow/${id}/dispute`, {
      buyerClaim: claimData.buyerClaim,
      agreedDeliveryTerms: claimData.agreedDeliveryTerms || "Deliver work within deadline.",
      buyerEvidenceUrl: claimData.evidenceUrl || ""
    });
    updateLocalEscrowStatus(userEmail, id, 'DISPUTED', {
      disputeReason: "Structured dispute opened by BUYER",
      buyerClaim: claimData.buyerClaim,
      sellerResponse: claimData.sellerResponse || "Awaiting seller response.",
      deliveryProofSubmitted: !!claimData.deliveryProofSubmitted,
      deadlineMet: !!claimData.deadlineMet,
      evidenceUrl: claimData.evidenceUrl || "",
      agreedDeliveryTerms: claimData.agreedDeliveryTerms || "Deliver work within deadline.",
      ...response.data
    });
    return response.data;
  },

  // Resolve Dispute (Admin)
  async resolveDispute(adminEmail, id, resolutionData) {
    const response = await api.post(`/escrow/${id}/resolve`, {
      resolution: resolutionData.resolution, // RELEASE_TO_SELLER or REFUND_TO_BUYER
      adminNotes: resolutionData.adminNotes
    });
    const targetStatus = resolutionData.resolution === 'RELEASE_TO_SELLER' ? 'RELEASED' : 'REFUNDED';
    updateLocalEscrowStatus(adminEmail, id, targetStatus, {
      disputeReason: `DISPUTE RESOLVED: ${resolutionData.adminNotes}`,
      ...response.data
    });
    return response.data;
  },

  // Get all escrows for active user (hybrid from local storage)
  getEscrowList() {
    return getLocalEscrows();
  }
};

export default escrowService;
