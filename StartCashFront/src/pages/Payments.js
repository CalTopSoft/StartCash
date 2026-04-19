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
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
      <div>
        <h1 class="page-title">Pagos</h1>
        <p class="page-subtitle">${allPaymentsData.length} pagos en total</p>
      </div>
    </div>

    <!-- Stats compactas -->
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Total cobrado</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--green);">${formatCurrency(totalAmount)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">Todos los prestamos</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Este mes</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--accent2);">${formatCurrency(totalThisMonth)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">${thisMonth.length} pagos en ${now.toLocaleString('es', {month:'long'})}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Transacciones</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--text);">${allPaymentsData.length}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">Total registradas</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Con pagos</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--text);">${loans.filter(l => l.amountPaid > 0).length}<span style="font-size:11px;color:var(--text3);font-weight:400;"> / ${loans.length}</span></div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">Prestamos activos</div>
      </div>
    </div>

    <!-- Buscador -->
    <div class="search-bar" style="margin-bottom:14px;max-width:100%;">
      ${icons.search}
      <input type="text" placeholder="Buscar por cliente..." id="paySearch"/>
    </div>

    <!-- Lista móvil -->
    <div class="card" style="padding:14px;">
      <div id="paymentsList"></div>
      <div id="emptyPays" class="empty-state" style="display:none;">
        <div class="empty-state-icon">${icons.payments}</div>
        <div class="empty-state-title">Sin pagos registrados</div>
        <div class="empty-state-desc">Los pagos aparecen aqui una vez registrados</div>
      </div>
    </div>
  `;

  const listEl = container.querySelector('#paymentsList');
  const emptyEl = container.querySelector('#emptyPays');

  function renderRows(data) {
    listEl.innerHTML = '';
    if (!data.length) { emptyEl.style.display = 'block'; return; }
    emptyEl.style.display = 'none';

    // Header
    const header = document.createElement('div');
header.style.cssText = 'display:grid;grid-template-columns:minmax(70px,1fr) minmax(80px,1fr) minmax(42px,80px) 32px 36px;gap:6px;align-items:center;padding:0 0 8px 0;border-bottom:2px solid var(--border);margin-bottom:4px;';
    header.innerHTML = `
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Cliente</div>
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Monto</div>
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Fecha</div>
<div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;text-align:center;">Ver</div>
<div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;text-align:center;padding-right:4px;">Borrar</div>    `;
    listEl.appendChild(header);

    data.forEach(p => {
      const fecha = formatDate(p.date).replace(/\s\d{4}$/, '');
      const row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:minmax(70px,1fr) minmax(80px,1fr) minmax(42px,80px) 32px 36px;gap:6px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);';      
      row.innerHTML = `
        <div style="min-width:0;">
          <div style="font-size:12px;font-weight:600;color:var(--text);max-width:65px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.loan?.clientId?.name || '—'}</div>
          <span class="${loanStatusClass(p.loan?.status)}" style="font-size:9px;padding:2px 6px;">${loanStatusLabel(p.loan?.status)}</span>
        </div>
        <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:var(--green);white-space:nowrap;">${formatCurrency(p.amount)}</div>
        <div style="font-size:11px;color:var(--text2);white-space:nowrap;">${fecha}</div>
<button style="width:26px;height:26px;background:none;border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);border-radius:var(--radius-sm);" data-view="${p.loan?._id}">${icons.eye}</button>
<button style="width:26px;height:26px;background:var(--red-bg);border:1px solid rgba(255,107,107,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--red);border-radius:var(--radius-sm);margin:0 auto;" data-delete="${p._id}" data-loan="${p.loan?._id}">${icons.trash}</button>
      `;
      listEl.appendChild(row);
    });
  }

  renderRows(allPaymentsData);

  const search = container.querySelector('#paySearch');
  search.oninput = debounce(() => {
    const q = search.value.toLowerCase();
    const filtered = allPaymentsData.filter(p => (p.loan?.clientId?.name || '').toLowerCase().includes(q));
    renderRows(filtered);
  }, 250);

  listEl.addEventListener('click', async (e) => {
    const viewBtn = e.target.closest('[data-view]');
    const deleteBtn = e.target.closest('[data-delete]');

    if (viewBtn) renderLoanDetail(viewBtn.dataset.view);

    if (deleteBtn) {
      const paymentId = deleteBtn.dataset.delete;
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