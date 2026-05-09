import { authService } from './services/auth.service.js';
import { renderWakeUp } from './pages/WakeUp.js';
import { renderLogin } from './pages/Auth.js';
import { renderDashboard } from './pages/Dashboard.js';
import { renderClients } from './pages/Clients.js';
import { renderLoans } from './pages/Loans.js';
import { renderLoanDetail } from './pages/LoanDetail.js';
import { renderPayments } from './pages/Payments.js';
import { renderProfile } from './pages/Profile.js';
import { renderClientProfile } from './pages/ClientProfile.js';
import { renderDebts } from './pages/Debts.js';
import { startKeepAlive, stopKeepAlive } from './utility/keepAlive.js';

let showingWakeUp = false;

function cleanupAuthStyle() {
  const authStyle = document.getElementById('auth-centering-style');
  if (authStyle) authStyle.remove();
}

function applyTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function getPage() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  return hash.split('?')[0];
}

function navigate() {
  if (showingWakeUp) return;

  if (!authService.isAuthenticated()) {
    renderLogin(() => {
      startKeepAlive();
      window.location.hash = '#dashboard';
      navigate();
    });
    return;
  }

  cleanupAuthStyle();

  const page = getPage();
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'clients': {
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const clientId = params.get('id');
      if (clientId) {
        renderClientProfile(clientId);
      } else {
        renderClients();
      }
      break;
    }
    case 'loans': {
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const loanId = params.get('id');
      const back = params.get('back');
      if (loanId) {
        renderLoanDetail(loanId, back);
      } else {
        renderLoans();
      }
      break;
    }
    case 'payments':  renderPayments();  break;
    case 'profile':   renderProfile();   break;
    case 'debts':     renderDebts();     break;
    default: renderDashboard();
  }
}

applyTheme();

renderWakeUp(() => {
  if (authService.isAuthenticated()) startKeepAlive();
  navigate();
});

window.addEventListener('backend-unavailable', () => {
  if (showingWakeUp) return;
  showingWakeUp = true;
  stopKeepAlive();
  renderWakeUp(() => {
    showingWakeUp = false;
    if (authService.isAuthenticated()) startKeepAlive();
    navigate();
  });
});

window.addEventListener('navigate', navigate);
window.addEventListener('hashchange', navigate);
