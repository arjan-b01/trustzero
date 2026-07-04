import api from './api';

const auditService = {
  async getEscrowHistory(escrowId) {
    const response = await api.get(`/audit/escrow/${escrowId}`);
    return response.data;
  },

  async getWalletHistory(walletId) {
    const response = await api.get(`/audit/wallet/${walletId}`);
    return response.data;
  }
};

export default auditService;
