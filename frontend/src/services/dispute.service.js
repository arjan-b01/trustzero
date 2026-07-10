import api from './api';

const disputeService = {
  // Upload evidence file to backend VLM analyzer
  async uploadEvidence(escrowId, file, party, context = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('party', party);
    if (context) {
      formData.append('context', context);
    }
    const response = await api.post(`/evidence/escrow/${escrowId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get evidence list for an escrow
  async getEvidenceForEscrow(escrowId) {
    const response = await api.get(`/evidence/escrow/${escrowId}`);
    return response.data;
  }
};

export default disputeService;
