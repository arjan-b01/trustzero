import api from './api';

const walletService = {
  async getMyWallet() {
    const response = await api.get('/wallet/me');
    return response.data;
  },

  async deposit(amount) {
    const response = await api.post('/wallet/deposit', { amount: Number(amount) });
    return response.data;
  }
};

export default walletService;
