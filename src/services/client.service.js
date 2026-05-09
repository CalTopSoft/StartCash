import { api } from '../api/client.js';

export const clientService = {
  list: () => api.get('/clients'),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  lookupByPublicId: (publicId) => api.get(`/clients/lookup/${publicId}`),
  addByPublicId: (publicId) => api.post('/clients/by-public-id', { publicId }),
};  