import { createLayout } from '../components/Layout.js';
import { loanService } from '../services/loan.service.js';
import { paymentService } from '../services/payment.service.js';
import { confirmDialog } from '../components/Modal.js';
import { icons } from '../components/Icons.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, loanStatusClass, loanStatusLabel, debounce, isOverdue } from '../utility/helpers.js';
import { FIELD_LIMITS } from '../utility/validation.js';
import { renderLoanDetail } from './LoanDetail.js';

const STATUS_FILTERS = [
  { key: 'all', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
  { key: 'PARTIALLY_PAID', label: 'Parcial' },
  { key: 'PENDING', label: 'Pendiente' },
  { key: 'PAID', label: 'Pagado' },
  { key: 'overdue', label: 'Vencidos' },
];

export async function renderPayments() {
  document.body.innerHTML = '';
  const container = createLayout('payments', 'Pagos');
  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  try {
    const loans = await loanService.list();
    const paymentsData = await loadPaymentsWithLoans(loans);
    renderPaymentsPage(container, loans, paymentsData);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} ${err.message}</div>`;
  }
}

async function loadPaymentsWithLoans(loans) {
  const allPaymentsData = [];
  for (const loan of loans) {
    try {
      const payments = await paymentService.listByLoan(loan._id);
      payments.forEach((p) => allPaymentsData.push({ ...p, loan }));
    } catch {}
  }
  return allPaymentsData.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderPaymentsPage(container, loans, allPaymentsData) {
  let activeView = 'general';
  let activeFilter = 'all';
  let searchQuery = '';
  let selectedYear = new Date().getFullYear();
  let selectedMonth = new Date().getMonth();

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
      <div>
        <h1 class="page-title">Pagos</h1>
        <p class="page-subtitle">${allPaymentsData.length} pagos en total</p>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:14px;">
      <button class="chip active" id="chipGeneral" style="flex:1;justify-content:center;border-radius:12px;padding:8px 12px;">${icons.trendUp} General</button>
      <button class="chip" id="chipMes" style="flex:1;justify-content:center;border-radius:12px;padding:8px 12px;">${icons.calendar} Por mes</button>
    </div>

    <div id="monthNav" style="display:none;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
      <button class="btn btn-ghost btn-icon" id="prevMonth">${icons.arrowLeft}</button>
      <div style="flex:1;text-align:center;">
        <div id="monthLabel" style="font-size:16px;font-weight:700;color:var(--text);text-transform:capitalize;"></div>
      </div>
      <button class="btn btn-ghost btn-icon" id="nextMonth">${icons.arrowRight}</button>
    </div>

    <div id="statsMount"></div>

    <div id="statusFilterBar" style="display:flex;gap:6px;flex-wrap:nowrap;margin-bottom:14px;align-items:center;overflow:auto;">
      ${STATUS_FILTERS.map((f) => `
        <button data-filter="${f.key}" style="
          padding:6px 12px;
          border-radius:20px;
          font-size:12px;
          font-weight:600;
          border:1.5px solid var(--border);
          background:var(--surface);
          color:var(--text2);
          cursor:pointer;
          transition:all 200ms;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-width:34px;
          height:34px;
          white-space:nowrap;
        ">${f.label}</button>
      `).join('')}
    </div>

    <div class="search-bar" style="margin-bottom:14px;max-width:100%;">
      ${icons.search}
      <input type="text" placeholder="Buscar por cliente..." id="paySearch" maxlength="${FIELD_LIMITS.search.max}"/>
    </div>

    <div class="card" style="padding:14px;">
      <div id="paymentsList"></div>
      <div id="emptyPays" class="empty-state" style="display:none;">
        <div class="empty-state-icon">${icons.payments}</div>
        <div class="empty-state-title">Sin pagos registrados</div>
        <div class="empty-state-desc">No hay resultados para este filtro</div>
      </div>
    </div>
  `;

  const chipGeneral = container.querySelector('#chipGeneral');
  const chipMes = container.querySelector('#chipMes');
  const monthNav = container.querySelector('#monthNav');
  const monthLabel = container.querySelector('#monthLabel');
  const statsMount = container.querySelector('#statsMount');
  const listEl = container.querySelector('#paymentsList');
  const emptyEl = container.querySelector('#emptyPays');
  const search = container.querySelector('#paySearch');

  const getViewBaseData = () => {
    if (activeView === 'general') return [...allPaymentsData];
    return allPaymentsData.filter((p) => {
      const d = new Date(p.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  };

  const applyFilterAndSearch = (data) => {
    let out = filterByStatus(data, activeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      out = out.filter((p) => (p.loan?.clientId?.name || '').toLowerCase().includes(q));
    }
    return out.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const renderStats = () => {
    const baseData = getViewBaseData();
    const data = applyFilterAndSearch(baseData);
    const totalAmount = data.reduce((s, p) => s + p.amount, 0);
    const uniqueLoans = new Set(data.map((p) => p.loan?._id).filter(Boolean)).size;
    const pendingRelated = data.filter((p) => p.loan?.status !== 'PAID').length;
    const label = activeView === 'general'
      ? 'Periodo general'
      : new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(new Date(selectedYear, selectedMonth, 1));

    statsMount.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Total cobrado</div>
          <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--green);">${formatCurrency(totalAmount)}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">${label}</div>
        </div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Transacciones</div>
          <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--text);">${data.length}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">Filtradas</div>
        </div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Prestamos con pago</div>
          <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--accent2);">${uniqueLoans}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">Unicos</div>
        </div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Asociados activos</div>
          <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--text);">${pendingRelated}<span style="font-size:11px;color:var(--text3);font-weight:400;"> / ${data.length}</span></div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">No pagados</div>
        </div>
      </div>
    `;
  };

  const renderRows = () => {
    const baseData = getViewBaseData();
    const data = applyFilterAndSearch(baseData);
    listEl.innerHTML = '';

    if (!data.length) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    const header = document.createElement('div');
    header.style.cssText = 'display:grid;grid-template-columns:minmax(80px,1fr) minmax(80px,1fr) minmax(56px,90px) 32px 32px;gap:6px;align-items:center;padding:0 0 8px 0;border-bottom:2px solid var(--border);margin-bottom:4px;';
    header.innerHTML = `
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Cliente</div>
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Monto</div>
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Fecha</div>
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;text-align:center;">Ver</div>
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;text-align:center;">Borrar</div>
    `;
    listEl.appendChild(header);

    data.forEach((p) => {
      const fecha = formatDate(p.date).replace(/\s\d{4}$/, '');
      const row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:minmax(80px,1fr) minmax(80px,1fr) minmax(56px,90px) 32px 32px;gap:6px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);';
      row.innerHTML = `
        <div style="min-width:0;">
          <div style="font-size:12px;font-weight:600;color:var(--text);max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.loan?.clientId?.name || '-'}</div>
          <span class="${loanStatusClass(p.loan?.status)}" style="font-size:9px;padding:2px 6px;">${loanStatusLabel(p.loan?.status)}</span>
        </div>
        <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:var(--green);white-space:nowrap;">${formatCurrency(p.amount)}</div>
        <div style="font-size:11px;color:var(--text2);white-space:nowrap;">${fecha}</div>
        <button style="width:26px;height:26px;background:none;border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);border-radius:var(--radius-sm);" data-view="${p.loan?._id}">${icons.eye}</button>
        <button style="width:26px;height:26px;background:var(--red-bg);border:1px solid rgba(255,107,107,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--red);border-radius:var(--radius-sm);" data-delete="${p._id}">${icons.trash}</button>
      `;
      listEl.appendChild(row);
    });
  };

  const renderAll = () => {
    if (activeView === 'month') {
      monthNav.style.display = 'flex';
      const label = new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(new Date(selectedYear, selectedMonth, 1));
      monthLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    } else {
      monthNav.style.display = 'none';
    }
    paintStatusFilterBar(container.querySelector('#statusFilterBar'), activeFilter);
    renderStats();
    renderRows();
  };

  chipGeneral.onclick = () => {
    activeView = 'general';
    chipGeneral.classList.add('active');
    chipMes.classList.remove('active');
    renderAll();
  };

  chipMes.onclick = () => {
    activeView = 'month';
    chipMes.classList.add('active');
    chipGeneral.classList.remove('active');
    renderAll();
  };

  container.querySelector('#prevMonth').onclick = () => {
    selectedMonth -= 1;
    if (selectedMonth < 0) {
      selectedMonth = 11;
      selectedYear -= 1;
    }
    renderAll();
  };

  container.querySelector('#nextMonth').onclick = () => {
    selectedMonth += 1;
    if (selectedMonth > 11) {
      selectedMonth = 0;
      selectedYear += 1;
    }
    renderAll();
  };

  container.querySelector('#statusFilterBar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    renderAll();
  });

  search.oninput = debounce(() => {
    searchQuery = search.value.trim();
    renderRows();
    renderStats();
  }, 200);

  listEl.addEventListener('click', async (e) => {
    const viewBtn = e.target.closest('[data-view]');
    const deleteBtn = e.target.closest('[data-delete]');

    if (viewBtn) {
      renderLoanDetail(viewBtn.dataset.view);
      return;
    }

    if (deleteBtn) {
      const paymentId = deleteBtn.dataset.delete;
      confirmDialog('¿Eliminar este pago? El saldo del prestamo sera revertido.', async () => {
        try {
          await paymentService.delete(paymentId);
          toast.success('Pago eliminado');
          const freshLoans = await loanService.list();
          const freshPaymentsData = await loadPaymentsWithLoans(freshLoans);
          renderPaymentsPage(container, freshLoans, freshPaymentsData);
        } catch (err) {
          toast.error(err.message);
        }
      });
    }
  });

  renderAll();
}

function filterByStatus(data, filterKey) {
  if (filterKey === 'all') return [...data];
  if (filterKey === 'overdue') return data.filter((p) => isOverdue(p.loan?.dueDate, p.loan?.status));
  return data.filter((p) => p.loan?.status === filterKey);
}

function paintStatusFilterBar(el, activeKey) {
  el.querySelectorAll('[data-filter]').forEach((btn) => {
    const isActive = btn.dataset.filter === activeKey;
    btn.style.background = isActive ? 'var(--accent)' : 'var(--surface)';
    btn.style.color = isActive ? '#fff' : 'var(--text2)';
  });
}
