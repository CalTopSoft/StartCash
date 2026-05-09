import { api } from '../api/client.js';
import { loanService } from './loan.service.js';

export const paymentService = {
  listByLoan:   (loanId)    => api.get(`/payments/loan/${loanId}`),
  async listByClient(clientId) {
    try {
      return await api.get(`/payments/client/${clientId}`);
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      const isNetworkError =
        err instanceof TypeError ||
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('network request failed');

      if (isNetworkError) throw err;

      const allLoans = await loanService.list();
      const clientLoans = allLoans.filter(
        l => l.clientId?._id === clientId || l.clientId === clientId
      );

      const perLoanPayments = await Promise.all(
        clientLoans.map(async (loan) => {
          try {
            const payments = await api.get(`/payments/loan/${loan._id}`);
            return payments.map(p => ({
              ...p,
              loanId: typeof p.loanId === 'object' && p.loanId ? p.loanId : loan,
            }));
          } catch {
            return [];
          }
        })
      );

      return perLoanPayments
        .flat()
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }
  },
  create:       (data)      => api.post('/payments', data),
  delete:       (id)        => api.delete(`/payments/${id}`),
};
