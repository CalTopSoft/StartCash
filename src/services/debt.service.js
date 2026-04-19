import { api } from '../api/client.js';

export const debtService = {
  // Obtiene todos los préstamos donde el usuario autenticado es el deudor (linkedUserId)
  getMyDebts: () => api.get('/debts/mine'),

  // Obtiene los pagos de un préstamo específico donde soy deudor
  getPayments: (loanId) => api.get(`/debts/mine/${loanId}/payments`),
};