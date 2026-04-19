import { createLayout } from '../components/Layout.js';
import { loanService } from '../services/loan.service.js';
import { paymentService } from '../services/payment.service.js';
import { confirmDialog } from '../components/Modal.js';
import { icons } from '../components/Icons.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, loanStatusClass, loanStatusLabel, debounce } from '../utility/helpers.js';
import { renderLoanDetail } from './LoanDetail.js';

export async function renderPayments() {
  document.body.innerHTML = '';
  const container = createLayout('payments', 'Pagos');
  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  try {
    const loans = await loanService.list();
    renderPaymentsPage(container, loans);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} ${err.message}</div>`;
  }
}

async function renderPaymentsPage(container, loans) {
  let allPaymentsData = [];

  for (const loan of loans) {
    try {
      const payments = await paymentService.listByLoan(loan._id);
      payments.forEach(p => allPaymentsData.push({ ...p, loan }));
    } catch {}
  }

  allPaymentsData.sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalAmount = allPaymentsData.reduce((s, p) => s + p.amount, 0);
  const now = new Date();
  const thisMonth = allPaymentsData.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalThisMonth = thisMonth.reduce((s, p) => s + p.amount, 0);
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Historial de pagos</h1>
        <p class="page-subtitle">${allPaymentsData.length} pagos en total</p>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:24px;">
      <div class="stat-card">
        <div class="stat-label">Total cobrado</div>
        <div class="stat-value" style="font-size:24px;">${formatCurrency(totalAmount)}</div>
        <div class="stat-sub">En todos los prestamos</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pagos registrados</div>
        <div class="stat-value" style="font-size:24px;">${allPaymentsData.length}</div>
        <div class="stat-sub">Total de transacciones</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Prestamos con pago</div>
        <div class="stat-value" style="font-size:24px;">${loans.filter(l => l.amountPaid > 0).length}</div>
        <div class="stat-sub">De ${loans.length} total</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Cobrado este mes</div>
        <div class="stat-value" style="font-size:24px;">${formatCurrency(totalThisMonth)}</div>
        <div class="stat-sub">${thisMonth.length} pagos en ${now.toLocaleString('es', {month:'long'})}</div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:20px;">
        <div class="search-bar" style="max-width:100%;">
          ${icons.search}
          <input type="text" placeholder="Buscar por cliente..." id="paySearch"/>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Prestamo</th>
              <th>Monto</th>
              <th>Estado prestamo</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="paymentsBody"></tbody>
        </table>
      </div>
      <div id="emptyPays" class="empty-state" style="display:none;">
        <div class="empty-state-icon">${icons.payments}</div>
        <div class="empty-state-title">Sin pagos registrados</div>
        <div class="empty-state-desc">Los pagos aparecen aqui una vez registrados</div>
      </div>
    </div>
  `;

  const tbody = container.querySelector('#paymentsBody');
  const emptyEl = container.querySelector('#emptyPays');

  function renderRows(data) {
    tbody.innerHTML = '';
    if (!data.length) { emptyEl.style.display = 'block'; return; }
    emptyEl.style.display = 'none';

    data.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:var(--text2);font-size:13px;">${formatDate(p.date)}</td>
        <td class="td-primary">${p.loan?.clientId?.name || '—'}</td>
        <td class="td-mono" style="font-size:13px;color:var(--text3);">${formatCurrency(p.loan?.total || 0)}</td>
        <td class="td-mono" style="color:var(--green);font-weight:700;">${formatCurrency(p.amount)}</td>
        <td><span class="${loanStatusClass(p.loan?.status)}">${loanStatusLabel(p.loan?.status)}</span></td>
        <td>
          <div class="td-actions">
            <button class="btn btn-ghost btn-icon btn-sm" data-view="${p.loan?._id}" title="Ver prestamo">${icons.eye}</button>
            <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--red);" data-delete="${p._id}" data-loan="${p.loan?._id}" title="Eliminar pago">${icons.trash}</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderRows(allPaymentsData);

  const search = container.querySelector('#paySearch');
  search.oninput = debounce(() => {
    const q = search.value.toLowerCase();
    const filtered = allPaymentsData.filter(p => (p.loan?.clientId?.name || '').toLowerCase().includes(q));
    renderRows(filtered);
  }, 250);

  tbody.addEventListener('click', async (e) => {
    const viewBtn = e.target.closest('[data-view]');
    const deleteBtn = e.target.closest('[data-delete]');

    if (viewBtn) {
      renderLoanDetail(viewBtn.dataset.view);
    }

    if (deleteBtn) {
      const paymentId = deleteBtn.dataset.delete;
      const loanId = deleteBtn.dataset.loan;
      confirmDialog('¿Eliminar este pago? El saldo del prestamo sera revertido.', async () => {
        try {
          await paymentService.delete(paymentId);
          toast.success('Pago eliminado');
          allPaymentsData = allPaymentsData.filter(p => p._id !== paymentId);
          renderRows(allPaymentsData);
        } catch (err) {
          toast.error(err.message);
        }
      });
    }
  });
}
