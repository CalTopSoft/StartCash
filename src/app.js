import { authService } from './services/auth.service.js';
import { renderWakeUp } from './pages/WakeUp.js';
import { renderLogin } from './pages/Auth.js';
import { renderDashboard } from './pages/Dashboard.js';
import { renderClients } from './pages/Clients.js';
import { renderLoans } from './pages/Loans.js';
import { renderPayments } from './pages/Payments.js';
import { renderProfile } from './pages/Profile.js';
import { startKeepAlive } from './utility/keepAlive.js';

function applyTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function getPage() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  return hash;
}

function navigate() {
  if (!authService.isAuthenticated()) {
    renderLogin(() => {
      startKeepAlive();
      window.location.hash = '#dashboard';
      navigate();
    });
    return;
  }

  const page = getPage();
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'clients': renderClients(); break;
    case 'loans': renderLoans(); break;
    case 'payments': renderPayments(); break;
    case 'profile': renderProfile(); break;
    default: renderDashboard();
  }
}

applyTheme();

// Pantalla de wake-up primero, luego navegar
renderWakeUp(() => {
  if (authService.isAuthenticated()) startKeepAlive();
  navigate();
});

window.addEventListener('navigate', navigate);
window.addEventListener('hashchange', navigate);