import { api } from '../api/client.js';

export const authService = {
  async register(name, email, password) {
    const data = await api.post('/auth/register', { name, email, password });
    if (data.token) localStorage.setItem('token', data.token);
    if (data.usuario) localStorage.setItem('user', JSON.stringify(data.usuario));
    return data;
  },

  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    if (data.token) localStorage.setItem('token', data.token);
    if (data.usuario) localStorage.setItem('user', JSON.stringify(data.usuario));
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
  
  _saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },
};
