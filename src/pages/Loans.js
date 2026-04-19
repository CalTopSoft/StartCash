import { createLayout } from '../components/Layout.js';
import { loanService } from '../services/loan.service.js';
import { clientService } from '../services/client.service.js';
import { createModal, confirmDialog } from '../components/Modal.js';
import { inputGroup, selectGroup, showFieldError, clearFieldErrors } from '../components/FormBuilder.js';
import { icons } from '../components/Icons.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, loanStatusClass, loanStatusLabel, calcProgress, isOverdue, debounce } from '../utility/helpers.js';
import { renderLoanDetail } from './LoanDetail.js';

let allLoans = [];
let allClients = [];
let activeFilter = 'all';

export async function renderLoans() {
  document.body.innerHTML = '';
  const container = createLayout('loans', 'Prestamos');
  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  try {
    [allLoans, allClients] = await Promise.all([loanService.list(), clientService.list()]);
    renderLoansList(container);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} ${err.message}</div>`;
  }
}

function renderLoansList(container) {
  container.innerHTML = `
<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
      <div>
        <h1 class="page-title">Prestamos</h1>
        <p class="page-subtitle">${allLoans.length} prestamos registrados</p>
      </div>
      <button class="btn btn-primary btn-sm" id="newLoanBtn" style="flex-shrink:0;">${icons.plus} Nuevo Prestamo</button>
    </div>

<!-- Filtros -->
    <div style="display:flex;gap:6px;flex-wrap:nowrap;margin-bottom:16px;align-items:center;">
      ${[
        { key: 'all', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
        { key: 'PARTIALLY_PAID', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v10l4 2"/><circle cx="12" cy="12" r="10"/></svg>` },
        { key: 'PENDING', label: 'Pendiente' },
        { key: 'PAID', label: 'Pagado' },
        { key: 'overdue', label: 'Vencidos' },
      ].map(f => `
        <button data-filter="${f.key}" style="
          padding:6px 12px;
          border-radius:20px;
          font-size:12px;
          font-weight:600;
          border:1.5px solid var(--border);
          background:${activeFilter === f.key ? 'var(--accent)' : 'var(--surface)'};
          color:${activeFilter === f.key ? '#fff' : 'var(--text2)'};
          cursor:pointer;
          transition:all 200ms;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-width:34px;
          height:34px;
        ">${f.label}</button>
      `).join('')}
    </div>

    <!-- Búsqueda -->
    <div class="search-bar" style="margin-bottom:20px;max-width:100%;">
      ${icons.search}
      <input type="text" placeholder="Buscar cliente..." id="loanSearch"/>
    </div>

    <div id="loansGrid"></div>
    <div id="emptyLoans" class="empty-state" style="display:none;">
      <div class="empty-state-icon">${icons.loans}</div>
      <div class="empty-state-title">Sin prestamos</div>
      <div class="empty-state-desc">Crea el primer prestamo para un cliente</div>
      <button class="btn btn-primary" id="emptyNewBtn">${icons.plus} Nuevo prestamo</button>
    </div>
  `;

  const grid = container.querySelector('#loansGrid');
  const emptyEl = container.querySelector('#emptyLoans');

  function getFiltered(query = '') {
    let data = [...allLoans];
    if (activeFilter === 'overdue') data = data.filter(l => isOverdue(l.dueDate, l.status));
    else if (activeFilter !== 'all') data = data.filter(l => l.status === activeFilter);
    if (query) data = data.filter(l => (l.clientId?.name || '').toLowerCase().includes(query.toLowerCase()));
    return data;
  }

  const emptyMessages = {
    all: { title: 'Sin prestamos', desc: 'Crea el primer prestamo para un cliente' },
    PENDING: { title: 'Sin prestamos pendientes', desc: 'No tienes prestamos pendientes de cobro' },
    PARTIALLY_PAID: { title: 'Sin prestamos parciales', desc: 'No tienes prestamos pagados parcialmente' },
    PAID: { title: 'Sin prestamos pagados', desc: 'Aún no tienes prestamos completados' },
    overdue: { title: 'Sin prestamos vencidos', desc: 'Todo al dia, no tienes prestamos vencidos' },
  };

  function renderGrid(data) {
    grid.innerHTML = '';
    if (!data.length) {
      const msg = emptyMessages[activeFilter] || emptyMessages.all;
      emptyEl.style.display = 'block';
      emptyEl.innerHTML = `
        <div class="empty-state-icon">${icons.loans}</div>
        <div class="empty-state-title">${msg.title}</div>
        <div class="empty-state-desc">${msg.desc}</div>
        ${activeFilter === 'all' ? `<button class="btn btn-primary" id="emptyNewBtn">${icons.plus} Nuevo prestamo</button>` : ''}
      `;
      if (activeFilter === 'all') {
        emptyEl.querySelector('#emptyNewBtn')?.addEventListener('click', () => openModal());
      }
      return;
    }
    emptyEl.style.display = 'none';

    data.forEach(loan => {
      const progress = calcProgress(loan.amountPaid, loan.total);
      const overdue = isOverdue(loan.dueDate, loan.status);
      const clientAvatar = loan.clientId?.avatar
        ? `<img src="${loan.clientId.avatar.startsWith('data:') ? loan.clientId.avatar : `data:image/jpeg;base64,${loan.clientId.avatar}`}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
        : `<div class="user-avatar" style="width:36px;height:36px;font-size:13px;flex-shrink:0;">${(loan.clientId?.name || '?').slice(0,2).toUpperCase()}</div>`;

      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = '12px';
      card.innerHTML = `
        <!-- Header: cliente + estado -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          ${clientAvatar}
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${loan.clientId?.name || 'Cliente eliminado'}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:1px;">${formatDate(loan.dueDate)} ${overdue ? '· <span style="color:var(--red);">Vencido</span>' : ''}</div>
          </div>
          <span class="${loanStatusClass(loan.status)}" style="flex-shrink:0;font-size:11px;">${loanStatusLabel(loan.status)}</span>
        </div>

        <!-- Montos en grid 2x2 -->
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px;">
          <div style="padding:8px 6px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center;">
            <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Capital</div>
            <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--text);">${formatCurrency(loan.amount)}</div>
          </div>
          <div style="padding:8px 6px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center;">
            <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Interes</div>
            <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--yellow);">${formatCurrency(loan.interest)}</div>
          </div>
          <div style="padding:8px 6px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center;">
            <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Total</div>
            <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--text);">${formatCurrency(loan.total)}</div>
          </div>
          <div style="padding:8px 6px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center;">
            <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Cobrado</div>
            <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--green);">${formatCurrency(loan.amountPaid)}</div>
          </div>
        </div>

        <!-- Barra de progreso -->
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:4px;">
            <span>Progreso</span><span>${progress}%</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill ${loan.status === 'PAID' ? 'paid' : loan.status === 'PARTIALLY_PAID' ? 'partial' : ''}" style="width:${progress}%;"></div>
          </div>
        </div>

        <!-- Acciones -->
        <div style="display:flex;gap:8px;align-items:center;">
<button class="btn btn-sm" data-action="pay" data-id="${loan._id}" style="flex:1;background:var(--green);color:#fff;border:none;" ${loan.status === 'PAID' ? 'disabled' : ''}>Registrar pagos</button>          <button class="btn btn-secondary btn-sm" data-action="view" data-id="${loan._id}" style="flex:1;font-size:11px;">${icons.eye}Ver detalles</button>
          <button data-action="edit" data-id="${loan._id}" title="Editar" style="width:34px;height:34px;flex-shrink:0;background:none;border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);border-radius:var(--radius-sm);">${icons.edit}</button>
          <button data-action="delete" data-id="${loan._id}" title="Eliminar" style="width:34px;height:34px;flex-shrink:0;background:none;border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--red);border-radius:var(--radius-sm);">${icons.trash}</button>
        </div>

${loan.description ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${loan.description}</div>` : ''}      `;
      grid.appendChild(card);
    });
  }

  renderGrid(getFiltered());

  const search = container.querySelector('#loanSearch');
  search.oninput = debounce(() => renderGrid(getFiltered(search.value)), 250);

  container.querySelectorAll('[data-filter]').forEach(btn => {
    btn.onclick = () => {
      activeFilter = btn.dataset.filter;
      renderLoansList(container);
    };
  });

  const openModal = (loan = null) => loanModal(loan, allClients, async () => {
    allLoans = await loanService.list();
    renderLoansList(container);
  });

  container.querySelector('#newLoanBtn').onclick = () => openModal();
  container.querySelector('#emptyNewBtn')?.addEventListener('click', () => openModal());

  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const loan = allLoans.find(l => l._id === id);

    if (btn.dataset.action === 'view') renderLoanDetail(id);
    if (btn.dataset.action === 'edit') openModal(loan);
    if (btn.dataset.action === 'pay') {
      const { paymentModalStandalone } = await import('./LoanDetail.js');
      paymentModalStandalone(loan, async () => {
        allLoans = await loanService.list();
        renderLoansList(container);
      });
    }
    if (btn.dataset.action === 'delete') {
      confirmDialog(`¿Eliminar el prestamo de <strong>${loan.clientId?.name || 'este cliente'}</strong>?`, async () => {
        try {
          await loanService.delete(id);
          toast.success('Prestamo eliminado');
          allLoans = await loanService.list();
          renderLoansList(container);
        } catch (err) {
          toast.error(err.message);
        }
      });
    }
  });
}

export function loanModal(loan, clients, onSave) {
  const isEdit = !!loan;
  const content = document.createElement('div');
  content.className = 'form-grid';
  content.style.gap = '16px';

  if (!isEdit) {
    const clientOpts = clients.map(c => ({ value: c._id, label: c.name }));
    content.appendChild(selectGroup({ id: 'lClientId', label: 'Cliente', required: true, options: clientOpts }));
  } else {
    const info = document.createElement('div');
    info.style.cssText = 'padding:12px;background:var(--surface2);border-radius:var(--radius-sm);font-size:14px;color:var(--text2);';
    info.innerHTML = `
    <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Cliente</div>
    <div style="font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${loan.clientId?.name || '—'}</div>
  `;
    content.appendChild(info);
  }

  const grid2 = document.createElement('div');
  grid2.className = 'form-grid form-grid-2';
  grid2.style.gap = '16px';
  grid2.appendChild(inputGroup({ id: 'lAmount', label: 'Capital ($)', type: 'number', required: true, min: 0, step: '0.01', value: loan?.amount || '', placeholder: '0.00' }));
  grid2.appendChild(inputGroup({ id: 'lInterest', label: 'Interes ($)', type: 'number', required: true, min: 0, step: '0.01', value: loan?.interest || '', placeholder: '0.00' }));
  content.appendChild(grid2);

  const grid2b = document.createElement('div');
  grid2b.className = 'form-grid form-grid-2';
  grid2b.style.gap = '16px';
  const dueDateVal = loan?.dueDate ? new Date(loan.dueDate).toISOString().split('T')[0] : '';
  grid2b.appendChild(inputGroup({ id: 'lDueDate', label: 'Fecha de vencimiento', type: 'date', required: true, value: dueDateVal }));
  const payDateVal = loan?.paymentDate ? new Date(loan.paymentDate).toISOString().split('T')[0] : '';
  grid2b.appendChild(inputGroup({ id: 'lPayDate', label: 'Fecha de pago', type: 'date', value: payDateVal }));
  content.appendChild(grid2b);

  const descGroup = document.createElement('div');
  descGroup.className = 'input-group';
  descGroup.innerHTML = `
    <label class="input-label" for="lDesc">Descripcion</label>
<textarea id="lDesc" class="input-field" rows="3" placeholder="Opcional (máx. 300 caracteres)" maxlength="300" style="resize:vertical;">${loan?.description || ''}</textarea>  `;
  content.appendChild(descGroup);

  const footer = document.createElement('div');
  footer.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.style.cssText = 'background:var(--surface2);color:var(--red);border:1.5px solid rgba(255,107,107,0.3);font-weight:600;border-radius:var(--radius-sm);padding:13px;font-size:14px;';
  cancelBtn.textContent = 'Cancelar';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.style.cssText = 'padding:13px;font-size:14px;border-radius:var(--radius-sm);';
  saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear prestamo';
  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);

  const { close } = createModal({ title: isEdit ? 'Editar prestamo' : 'Nuevo prestamo', content, footer });
  cancelBtn.onclick = close;

  saveBtn.onclick = async () => {
    clearFieldErrors('lClientId', 'lAmount', 'lInterest', 'lDueDate');
    const amount = parseFloat(document.getElementById('lAmount').value);
    const interest = parseFloat(document.getElementById('lInterest').value);
    const dueDate = document.getElementById('lDueDate').value;
    const paymentDate = document.getElementById('lPayDate').value;
    const description = document.getElementById('lDesc').value.trim();
    let valid = true;

    if (!isEdit && !document.getElementById('lClientId')?.value) { showFieldError('lClientId', 'Selecciona un cliente'); valid = false; }
    if (isNaN(amount) || amount <= 0) { showFieldError('lAmount', 'Ingresa un monto valido'); valid = false; }
    if (isNaN(interest) || interest < 0) { showFieldError('lInterest', 'Ingresa un interes valido'); valid = false; }
    if (!dueDate) { showFieldError('lDueDate', 'La fecha de vencimiento es requerida'); valid = false; }
    const description2 = document.getElementById('lDesc').value.trim();
    if (description2.length > 300) { showFieldError('lDesc', 'Máximo 300 caracteres'); valid = false; }
    if (!valid) return;

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner"></span>`;

    try {
      const data = { amount, interest, dueDate };
      if (!isEdit) data.clientId = document.getElementById('lClientId').value;
      if (paymentDate) data.paymentDate = paymentDate;
      if (description) data.description = description;

      if (isEdit) { await loanService.update(loan._id, data); toast.success('Prestamo actualizado'); }
      else { await loanService.create(data); toast.success('Prestamo creado'); }
      close();
      onSave();
    } catch (err) {
      toast.error(err.message);
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear prestamo';
    }
  };
}
