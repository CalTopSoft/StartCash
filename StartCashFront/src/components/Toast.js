const toasts = [];
let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function iconSVG(type) {
  const icons = {
    success: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
    error: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
    warning: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,
    info: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-4m0-4h.01"/></svg>`,
  };
  return icons[type] || icons.info;
}

export function showToast(message, type = 'info', title = '') {
  const c = getContainer();
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;

  const colorMap = { success: 'var(--green)', error: 'var(--red)', warning: 'var(--yellow)', info: 'var(--accent2)' };
  el.innerHTML = `
    <span class="toast-icon" style="color:${colorMap[type]}">${iconSVG(type)}</span>
    <div class="toast-body">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-msg">${message}</div>
    </div>
  `;

  c.appendChild(el);

  setTimeout(() => {
    el.style.animation = 'toastIn 300ms reverse forwards';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

export const toast = {
  success: (msg, title = 'Exitoso') => showToast(msg, 'success', title),
  error: (msg, title = 'Error') => showToast(msg, 'error', title),
  warning: (msg, title = 'Advertencia') => showToast(msg, 'warning', title),
  info: (msg, title = '') => showToast(msg, 'info', title),
};
