import { toast } from '../components/Toast.js';

/*export const API_BASE_URL = 'http://localhost:3000/api';*/
export const API_BASE_URL = 'https://startcashback.onrender.com/api';
export const API_HEALTH_URL = `${API_BASE_URL}/health`;

let sessionExpiredHandled = false;
let backendUnavailableHandled = false;

function getToken() {
  return localStorage.getItem('token');
}

function isAuthTokenError(status, message = '') {
  if (status === 401 || status === 403) return true;
  const msg = String(message).toLowerCase();
  return (
    (msg.includes('token') && (msg.includes('expir') || msg.includes('inv') || msg.includes('invalid'))) ||
    msg.includes('jwt') ||
    msg.includes('unauthorized') ||
    msg.includes('no autorizado')
  );
}

function resetSessionAndGoToLogin() {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  toast.warning('Tu sesion expiro. Inicia sesion nuevamente.', 'Sesion expirada');
  window.location.hash = '';
  window.dispatchEvent(new Event('navigate'));
}

function isBackendUnavailableError(err) {
  const msg = String(err?.message || '').toLowerCase();
  return (
    err instanceof TypeError ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('network request failed')
  );
}

function goToWakeUpOnBackendUnavailable() {
  if (backendUnavailableHandled) return;
  backendUnavailableHandled = true;
  window.dispatchEvent(new Event('backend-unavailable'));
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    if (isBackendUnavailableError(err)) {
      goToWakeUpOnBackendUnavailable();
    }
    throw err;
  }

  backendUnavailableHandled = false;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.mensaje || data.message || 'Error en la solicitud';
    if (token && isAuthTokenError(res.status, msg)) {
      resetSessionAndGoToLogin();
    }
    throw new Error(msg);
  }

  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
