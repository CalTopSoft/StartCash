import { api } from '../api/client.js';

export const loanService = {
  list: (includeDeleted = false) => api.get(`/loans?includeDeleted=${includeDeleted}`),
  getOne: (id) => api.get(`/loans/${id}`),
  create: (data) => api.post('/loans', data),
  update: (id, data) => api.put(`/loans/${id}`, data),
  delete: (id) => api.delete(`/loans/${id}`),
  restore: (id) => api.patch(`/loans/${id}/restore`),
  getAuditLogs: (id) => api.get(`/loans/${id}/audit`),
  
};
