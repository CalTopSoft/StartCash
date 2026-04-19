export function createModal({ title, content, footer, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div>
          <div class="modal-title">${title}</div>
        </div>
        <button class="modal-close" aria-label="Cerrar">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="modal-body"></div>
      ${footer ? `<div class="modal-footer"></div>` : ''}
    </div>
  `;

  const body = overlay.querySelector('.modal-body');
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }

  if (footer) {
    const footerEl = overlay.querySelector('.modal-footer');
    if (typeof footer === 'string') {
      footerEl.innerHTML = footer;
    } else {
      footerEl.appendChild(footer);
    }
  }

  const close = () => {
    overlay.classList.remove('open');
    setTimeout(() => { overlay.remove(); onClose?.(); }, 250);
  };

  overlay.querySelector('.modal-close').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
  });

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));

  return { overlay, close };
}

export function confirmDialog(message, onConfirm) {
  const content = document.createElement('div');
  content.innerHTML = `<p style="color:var(--text2);font-size:15px;line-height:1.6;">${message}</p>`;

  const footer = document.createElement('div');
  footer.className = 'modal-footer';

  const { close } = createModal({
    title: 'Confirmar accion',
    content,
    footer,
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.onclick = close;

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-danger';
  confirmBtn.textContent = 'Eliminar';
  confirmBtn.onclick = () => { close(); onConfirm(); };

  footer.appendChild(cancelBtn);
  footer.appendChild(confirmBtn);
}
