import { api } from '../api/client.js';

export const paymentService = {
  listByLoan: (loanId) => api.get(`/payments/loan/${loanId}`),
  create: (data) => api.post('/payments', data),
  delete: (id) => api.delete(`/payments/${id}`),
};
