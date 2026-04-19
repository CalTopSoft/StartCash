import { icons } from './Icons.js';
import { authService } from '../services/auth.service.js';
import { getInitials } from '../utility/helpers.js';

export function createLayout(activePage, pageTitle) {
  // Siempre leer el usuario fresco desde localStorage en el momento de crear el layout
  const user = authService.getUser();
  const isDark = localStorage.getItem('theme') !== 'light';

  const layout = document.createElement('div');
  layout.className = 'layout';

  layout.innerHTML = `
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
      <div class="sidebar-logo-icon">
        <img src="/src/assets/icons/logo.png"  alt="logo" />
      </div>
        <div>
          <div class="sidebar-logo-text">StartCash</div>
          <div class="sidebar-logo-sub">v1.0</div>
        </div>
      </div>

      <nav class="sidebar-nav" id="sidebarNav">
        <span class="nav-section-label">Principal</span>
        <a class="nav-item ${activePage === 'dashboard' ? 'active' : ''}" data-page="dashboard" href="#">
          ${icons.dashboard} Panel
        </a>
        <span class="nav-section-label">Gestion</span>
        <a class="nav-item ${activePage === 'clients' ? 'active' : ''}" data-page="clients" href="#">
          ${icons.clients} Clientes
        </a>
        <a class="nav-item ${activePage === 'loans' ? 'active' : ''}" data-page="loans" href="#">
          ${icons.loans} Prestamos
        </a>
        <a class="nav-item ${activePage === 'payments' ? 'active' : ''}" data-page="payments" href="#">
          ${icons.payments} Pagos
        </a>
        <span class="nav-section-label">Cuenta</span>
        <a class="nav-item ${activePage === 'profile' ? 'active' : ''}" data-page="profile" href="#">
          ${icons.user} Mi perfil
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" id="sidebarUserInfo">
          ${renderSidebarUser(user)}
        </div>
        <button class="btn btn-ghost btn-sm w-full" id="logoutBtn" style="justify-content:flex-start;gap:8px;">
          ${icons.logout} Cerrar sesion
        </button>
      </div>
    </aside>

    <div class="main-content">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-toggle" id="menuToggle">${icons.menu}</button>
          <span class="topbar-title">${pageTitle}</span>
        </div>
        <button class="btn btn-ghost btn-icon" id="themeToggle" title="Cambiar tema">
          ${isDark ? icons.sun : icons.moon}
        </button>
      </header>
      <main class="page-content" id="pageContent"></main>
    </div>
  `;

  document.body.appendChild(layout);

  const sidebar    = layout.querySelector('#sidebar');
  const overlay    = layout.querySelector('#sidebarOverlay');
  const menuToggle = layout.querySelector('#menuToggle');
  const themeBtn   = layout.querySelector('#themeToggle');
  const logoutBtn  = layout.querySelector('#logoutBtn');

  menuToggle.onclick = () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  };

  overlay.onclick = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  };

  themeBtn.onclick = () => {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';
    html.setAttribute('data-theme', isLight ? 'dark' : 'light');
    localStorage.setItem('theme', isLight ? 'dark' : 'light');
    themeBtn.innerHTML = isLight ? icons.sun : icons.moon;
  };

  logoutBtn.onclick = () => {
    authService.logout();
    window.location.hash = '#login';
    renderApp();
  };

  layout.querySelectorAll('[data-page]').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      window.location.hash = `#${page}`;
      renderApp();
    };
  });

  // Escuchar evento personalizado para actualizar el sidebar sin recargar página
  // Se dispara desde cualquier lugar con: window.dispatchEvent(new CustomEvent('userUpdated'))
  const handleUserUpdated = () => {
    const fresh = authService.getUser();
    const userInfoEl = document.getElementById('sidebarUserInfo');
    if (userInfoEl && fresh) {
      userInfoEl.innerHTML = renderSidebarUser(fresh);
    }
  };

  window.addEventListener('userUpdated', handleUserUpdated);

  // Limpiar listener cuando el layout se desmonte (cuando se recrea la página)
  const observer = new MutationObserver(() => {
    if (!document.body.contains(layout)) {
      window.removeEventListener('userUpdated', handleUserUpdated);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });

  return layout.querySelector('#pageContent');
}

// Función auxiliar que genera el HTML del usuario en el sidebar
function renderSidebarUser(user) {
  const avatarHTML = user?.avatar
    ? `<img src="${user.avatar.startsWith('data:') ? user.avatar : `data:image/jpeg;base64,${user.avatar}`}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
    : `<div class="user-avatar">${getInitials(user?.name || 'U')}</div>`;

  return `
    ${avatarHTML}
    <div>
      <div class="user-name">${user?.name || 'Usuario'}</div>
      <div class="user-role">Administrador</div>
    </div>
  `;
}

function renderApp() {
  window.dispatchEvent(new CustomEvent('navigate'));
}