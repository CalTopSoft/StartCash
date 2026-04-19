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
    <div class="page-header">
      <div>
        <h1 class="page-title">Prestamos</h1>
        <p class="page-subtitle">${allLoans.length} prestamos registrados</p>
      </div>
      <button class="btn btn-primary" id="newLoanBtn">${icons.plus} Nuevo prestamo</button>
    </div>

    <div class="card" style="margin-bottom:20px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="chip active" data-filter="all">Todos</button>
          <button class="chip" data-filter="PENDING">Pendiente</button>
          <button class="chip" data-filter="PARTIALLY_PAID">Parcial</button>
          <button class="chip" data-filter="PAID">Pagado</button>
          <button class="chip" data-filter="overdue">Vencidos</button>
        </div>
        <div class="search-bar">
          ${icons.search}
          <input type="text" placeholder="Buscar cliente..." id="loanSearch"/>
        </div>
      </div>
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

  function renderGrid(data) {
    grid.innerHTML = '';
    if (!data.length) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    data.forEach(loan => {
      const progress = calcProgress(loan.amountPaid, loan.total);
      const overdue = isOverdue(loan.dueDate, loan.status);
      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = '16px';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="user-avatar" style="font-size:13px;">${(loan.clientId?.name || '?').slice(0,2).toUpperCase()}</div>
            <div>
              <div style="font-weight:600;color:var(--text);font-size:15px;">${loan.clientId?.name || 'Cliente eliminado'}</div>
              <div style="font-size:12px;color:var(--text3);">${loan.clientId?.email || loan.clientId?.phone || ''}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="${loanStatusClass(loan.status)}">${loanStatusLabel(loan.status)}</span>
            ${overdue ? `<span class="badge badge-red">${icons.alert.replace('width="16"','width="12"').replace('height="16"','height="12"')} Vencido</span>` : ''}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:16px;margin-bottom:16px;">
          <div>
            <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Capital</div>
            <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--text);">${formatCurrency(loan.amount)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Interes</div>
            <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--yellow);">${formatCurrency(loan.interest)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Total</div>
            <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--text);">${formatCurrency(loan.total)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Cobrado</div>
            <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--green);">${formatCurrency(loan.amountPaid)}</div>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-bottom:6px;">
            <span>Progreso de pago</span><span>${progress}%</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill ${loan.status === 'PAID' ? 'paid' : loan.status === 'PARTIALLY_PAID' ? 'partial' : ''}" style="width:${progress}%;"></div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="font-size:13px;color:var(--text3);">
            ${icons.calendar} Vence: <span style="${overdue ? 'color:var(--red);' : ''}">${formatDate(loan.dueDate)}</span>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" data-action="view" data-id="${loan._id}">${icons.eye} Ver detalle</button>
            <button class="btn btn-ghost btn-icon btn-sm" data-action="edit" data-id="${loan._id}" title="Editar">${icons.edit}</button>
            <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--red);" data-action="delete" data-id="${loan._id}" title="Eliminar">${icons.trash}</button>
          </div>
        </div>
        ${loan.description ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:13px;color:var(--text3);">${loan.description}</div>` : ''}
      `;
      grid.appendChild(card);
    });
  }

  renderGrid(getFiltered());

  const search = container.querySelector('#loanSearch');
  search.oninput = debounce(() => renderGrid(getFiltered(search.value)), 250);

  container.querySelectorAll('[data-filter]').forEach(chip => {
    chip.onclick = () => {
      container.querySelectorAll('[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderGrid(getFiltered(search.value));
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
    if (btn.dataset.action === 'view') {
      renderLoanDetail(id);
    }
    if (btn.dataset.action === 'edit') openModal(loan);
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

function loanModal(loan, clients, onSave) {
  const isEdit = !!loan;
  const content = document.createElement('div');
  content.className = 'form-grid';
  content.style.gap = '16px';

  if (!isEdit) {
    const clientOpts = clients.map(c => ({ value: c._id, label: c.name }));
    const clientSel = selectGroup({ id: 'lClientId', label: 'Cliente', required: true, options: clientOpts });
    content.appendChild(clientSel);
  } else {
    const info = document.createElement('div');
    info.style.cssText = 'padding:12px;background:var(--surface2);border-radius:var(--radius-sm);font-size:14px;color:var(--text2);';
    info.innerHTML = `Cliente: <strong style="color:var(--text);">${loan.clientId?.name || '—'}</strong>`;
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
    <textarea id="lDesc" class="input-field" rows="3" placeholder="Opcional" style="resize:vertical;">${loan?.description || ''}</textarea>
  `;
  content.appendChild(descGroup);

  const footer = document.createElement('div');
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancelar';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
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

    if (!isEdit) {
      const clientId = document.getElementById('lClientId')?.value;
      if (!clientId) { showFieldError('lClientId', 'Selecciona un cliente'); valid = false; }
    }
    if (isNaN(amount) || amount <= 0) { showFieldError('lAmount', 'Ingresa un monto valido'); valid = false; }
    if (isNaN(interest) || interest < 0) { showFieldError('lInterest', 'Ingresa un interes valido'); valid = false; }
    if (!dueDate) { showFieldError('lDueDate', 'La fecha de vencimiento es requerida'); valid = false; }
    if (!valid) return;

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner"></span>`;

    try {
      const data = { amount, interest, dueDate };
      if (!isEdit) data.clientId = document.getElementById('lClientId').value;
      if (paymentDate) data.paymentDate = paymentDate;
      if (description) data.description = description;

      if (isEdit) {
        await loanService.update(loan._id, data);
        toast.success('Prestamo actualizado');
      } else {
        await loanService.create(data);
        toast.success('Prestamo creado');
      }
      close();
      onSave();
    } catch (err) {
      toast.error(err.message);
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear prestamo';
    }
  };
}
