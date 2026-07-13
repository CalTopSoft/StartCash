import { createLayout } from '../components/Layout.js';
import { clientService } from '../services/client.service.js';
import { loanService } from '../services/loan.service.js';
import { paymentService } from '../services/payment.service.js';
import { createLoanCard } from '../components/LoanCard.js';
import { createStatsGrid } from '../components/StatsGrid.js';
import { icons, icon } from '../components/Icons.js';
import { formatCurrency, formatDate, isOverdue, loanStatusLabel, loanTypeLabel, loanTypeIcon, loanTypeColor } from '../utility/helpers.js';

const LOAN_FILTERS = [
  { key: 'all', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
  { key: 'PARTIALLY_PAID', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v10l4 2"/><circle cx="12" cy="12" r="10"/></svg>` },
  { key: 'PENDING', label: 'Pendiente' },
  { key: 'PAID', label: 'Pagado' },
  { key: 'overdue', label: 'Vencidos' },
];

const TYPE_FILTERS = [
  { key: 'all', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
  { key: 'NORMAL', label: 'Normal' },
  { key: 'FIXED_INTEREST', label: 'Interés fijo' },
  { key: 'INSTALLMENTS', label: 'Diferidos' },
];

export async function renderClientProfile(clientId) {
  document.body.innerHTML = '';
  const container = createLayout('clients', 'Perfil de cliente');
  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  try {
    const [client, loans, payments] = await Promise.all([
      clientService.getOne(clientId),
      loanService.list(),
      paymentService.listByClient(clientId).catch(() => []),
    ]);

    const clientLoans = loans.filter((l) => l.clientId?._id === clientId || l.clientId === clientId);
    renderProfile(container, client, clientLoans, payments, clientId);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} ${err.message}</div>`;
  }
}

function renderProfile(container, client, loans, payments, clientId) {
  // Calcular métricas por tipo de préstamo
  const tipos = {
    NORMAL: { count: 0, totalCapital: 0, totalInteres: 0, totalPagado: 0 },
    FIXED_INTEREST: { count: 0, totalCapital: 0, totalInteres: 0, totalPagado: 0 },
    INSTALLMENTS: { count: 0, totalCapital: 0, totalInteres: 0, totalPagado: 0 },
  };

  loans.forEach(loan => {
    const loanType = loan.loanType || 'NORMAL';
    const capital = loanType === 'FIXED_INTEREST' 
      ? (loan.capitalOriginal ?? loan.amount ?? 0)
      : loan.amount ?? 0;
    const interes = loanType === 'FIXED_INTEREST'
      ? (loan.interesesGenerados ?? 0)
      : loan.interest ?? 0;
    const pagado = loanType === 'FIXED_INTEREST'
      ? (loan.totalPagado ?? 0)
      : loan.amountPaid ?? 0;

    if (tipos[loanType]) {
      tipos[loanType].count++;
      tipos[loanType].totalCapital += capital;
      tipos[loanType].totalInteres += interes;
      tipos[loanType].totalPagado += pagado;
    }
  });

  const totalCapital = loans.reduce((s, l) => s + l.amount, 0);
  const totalInteres = loans.reduce((s, l) => s + l.interest, 0);
  const totalCobrado = loans.reduce((s, l) => s + l.amountPaid, 0);
  const deudaTotal = loans.reduce((s, l) => s + Math.max(0, l.total - l.amountPaid), 0);
  const activos = loans.filter((l) => l.status !== 'PAID').length;
  const pagados = loans.filter((l) => l.status === 'PAID').length;
  const vencidos = loans.filter((l) => isOverdue(l.dueDate, l.status)).length;
  const capitalRiesgo = loans
    .filter((l) => l.status !== 'PAID')
    .reduce((s, l) => s + (l.total - l.amountPaid), 0);

  const badgeColor = vencidos > 0 ? 'var(--red)' : activos > 0 ? 'var(--yellow)' : 'var(--green)';
  const badgeBg = vencidos > 0 ? 'var(--red-bg)' : activos > 0 ? 'var(--yellow-bg)' : 'var(--green-bg)';
  const badgeLabel = vencidos > 0 ? 'Tiene vencidos' : activos > 0 ? 'Activo' : 'Al dia';

  const avatarHTML = client.avatar
    ? `<img src="${client.avatar.startsWith('data:') ? client.avatar : `data:image/jpeg;base64,${client.avatar}`}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
    : `<div class="user-avatar" style="width:56px;height:56px;font-size:18px;flex-shrink:0;">${(client.name || 'U').slice(0,2).toUpperCase()}</div>`;

  container.innerHTML = `
    <button class="btn btn-ghost btn-sm" id="backBtn" style="margin-bottom:16px;">
      ${icons.arrowLeft} Regresar a clientes
    </button>

    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:12px;">
        ${avatarHTML}
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;min-width:0;">
            <span style="flex:1;min-width:0;font-size:14px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${client.name}</span>
            <span style="flex-shrink:0;display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${badgeBg};color:${badgeColor};">${badgeLabel}</span>
          </div>
          <div style="display:flex;gap:12px;min-width:0;">
            ${client.email ? `<span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;">${icons.mail} ${client.email}</span>` : ''}
          </div>
        </div>
      </div>
    </div>

    <div id="profileStatsMount"></div>

    <!-- Stats por tipo de préstamo - 3 columnas -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
      ${[
        { key: 'NORMAL', label: 'Normal', color: 'var(--green)', icon: 'money' },
        { key: 'FIXED_INTEREST', label: 'Interés fijo', color: 'var(--yellow)', icon: 'clock' },
        { key: 'INSTALLMENTS', label: 'Diferidos', color: 'var(--accent2)', icon: 'calendar' },
      ].map(tipo => {
        const data = tipos[tipo.key] || { count: 0, totalCapital: 0, totalInteres: 0, totalPagado: 0 };
        return `
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:8px;text-align:center;">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-bottom:2px;">
              <span style="color:${tipo.color};">${icon(tipo.icon, 12)}</span>
              <span style="font-size:9px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.03em;">${tipo.label}</span>
            </div>
            <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:${tipo.color};">${data.count}</div>
            <div style="font-size:8px;color:var(--text3);">Cap: ${formatCurrency(data.totalCapital)}</div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="card" style="margin-bottom:16px;padding:9px 10px;text-align:center;background:var(--red-bg);border:1px solid rgba(255,107,107,0.28);">
      <div style="font-size:11px;color:var(--red);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Deuda total restante</div>
      <div style="font-family:var(--mono);font-size:16px;font-weight:700;line-height:1.15;color:var(--red);">${formatCurrency(deudaTotal)}</div>
      <div style="font-size:10px;color:var(--text3);margin-top:1px;">Saldo pendiente actual</div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="chip active" id="chipGeneral" style="flex:1;justify-content:center;border-radius:12px;padding:8px 12px;">${icons.trendUp} General</button>
      <button class="chip" id="chipMes" style="flex:1;justify-content:center;border-radius:12px;padding:8px 12px;">${icons.calendar} Por mes</button>
    </div>

    <div id="viewGeneral">
      <div class="card" style="margin-bottom:14px;">
        <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px;">
          ${icons.trendUp} Estadisticas del cliente
        </div>
        <div id="generalStatsMount"></div>
        ${vencidos > 0 ? `
          <div style="margin-top:12px;padding:10px 12px;background:var(--red-bg);border:1px solid rgba(255,107,107,0.2);border-radius:var(--radius-sm);display:flex;align-items:center;gap:8px;font-size:12px;color:var(--red);">
            <span style="color:var(--yellow);display:inline-flex;align-items:center;">${icons.alert}</span>
            <strong>${vencidos} ${vencidos === 1 ? 'prestamo vencido' : 'prestamos vencidos'}</strong> actualmente
          </div>
        ` : ''}
      </div>

      <!-- Filtros de estado -->
      ${renderFilterBar('general')}
      <!-- Filtros por tipo -->
      ${renderTypeFilterBar('generalType')}
      <div id="generalLoansTitle" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:10px;"></div>
      <div id="generalLoansMount"></div>
    </div>

    <div id="viewMes" style="display:none;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-icon" id="prevMonth">${icons.arrowLeft}</button>
        <div style="flex:1;text-align:center;">
          <div id="monthLabel" style="font-size:16px;font-weight:700;color:var(--text);text-transform:capitalize;"></div>
        </div>
        <button class="btn btn-ghost btn-icon" id="nextMonth">${icons.arrowRight}</button>
      </div>
      <div id="monthStatsMount"></div>
      ${renderFilterBar('month')}
      ${renderTypeFilterBar('monthType')}
      <div id="monthLoansTitle" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:10px;"></div>
      <div id="monthLoansMount"></div>
      <div id="monthPaymentsMount"></div>
      <div id="monthEmpty" class="empty-state" style="display:none;">
        <div class="empty-state-icon">${icons.calendar}</div>
        <div class="empty-state-title">Sin actividad</div>
        <div class="empty-state-desc">No hubo movimientos este mes con este cliente</div>
      </div>
    </div>
  `;

  const profileStats = createStatsGrid([
    { label: 'Capital prestado', value: formatCurrency(totalCapital), sub: `${loans.length} prestamos`, color: 'var(--accent2)' },
    { label: 'Interes generado', value: formatCurrency(totalInteres), sub: 'Ganancias totales', color: 'var(--green)' },
    { label: 'Total cobrado', value: formatCurrency(totalCobrado), sub: 'Pagos recibidos', color: 'var(--green)' },
    { label: 'Estado', value: `${activos} / ${loans.length}`, sub: 'Activos / Total', color: 'var(--text)' },
  ]);
  container.querySelector('#profileStatsMount').appendChild(profileStats);

  const tasaCumplimiento = loans.length ? Math.round((pagados / loans.length) * 100) : 0;
  const promedioPrestamo = loans.length ? totalCapital / loans.length : 0;
  const pagosPorMes = {};
  payments.forEach((p) => {
    const key = new Date(p.date).toISOString().slice(0, 7);
    pagosPorMes[key] = (pagosPorMes[key] || 0) + p.amount;
  });
  const mejorMesKey = Object.keys(pagosPorMes).sort((a, b) => pagosPorMes[b] - pagosPorMes[a])[0];
  const mejorMesLabel = mejorMesKey
    ? new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(new Date(`${mejorMesKey}-15`))
    : 'N/A';

  const generalStats = createStatsGrid([
    { label: 'Tasa cumplimiento', value: `${tasaCumplimiento}%`, sub: 'Prestamos pagados', color: tasaCumplimiento >= 70 ? 'var(--green)' : tasaCumplimiento >= 40 ? 'var(--yellow)' : 'var(--red)' },
    { label: 'Capital en riesgo', value: formatCurrency(capitalRiesgo), sub: 'Saldo pendiente', color: 'var(--red)' },
    { label: 'Prestamo promedio', value: formatCurrency(promedioPrestamo), sub: 'Por credito', color: 'var(--accent2)' },
    { label: 'Mejor mes', value: mejorMesLabel, sub: 'Mayor cobro registrado', color: 'var(--text)' },
  ]);
  container.querySelector('#generalStatsMount').appendChild(generalStats);

  container.querySelector('#backBtn').onclick = () => {
    window.location.hash = '#clients';
    window.dispatchEvent(new CustomEvent('navigate'));
  };

  const chipGeneral = container.querySelector('#chipGeneral');
  const chipMes = container.querySelector('#chipMes');
  const viewGeneral = container.querySelector('#viewGeneral');
  const viewMes = container.querySelector('#viewMes');

  let generalFilter = 'all';
  let generalTypeFilter = 'all';
  let monthFilter = 'all';
  let monthTypeFilter = 'all';
  let monthYear = new Date().getFullYear();
  let monthIndex = new Date().getMonth();

  const monthLabel = container.querySelector('#monthLabel');

  const filterLoansByType = (loansData, typeKey) => {
    if (typeKey === 'all') return loansData;
    return loansData.filter(l => (l.loanType || 'NORMAL') === typeKey);
  };

  const renderGeneralLoans = () => {
    const generalLoansMount = container.querySelector('#generalLoansMount');
    const generalTitle = container.querySelector('#generalLoansTitle');
    generalLoansMount.innerHTML = '';

    let filtered = filterLoans(loans, generalFilter);
    filtered = filterLoansByType(filtered, generalTypeFilter);
    generalTitle.textContent = `${loanFilterTitle(generalFilter)}${generalTypeFilter !== 'all' ? ` · ${loanTypeLabel(generalTypeFilter)}` : ''} (${filtered.length})`;

    if (!filtered.length) {
      generalLoansMount.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${icons.money}</div>
          <div class="empty-state-title">Sin prestamos para este filtro</div>
        </div>
      `;
      return;
    }

    filtered.forEach((loan) => {
      const card = createLoanCard(loan, {
        showClient: false,
        onViewDetail: () => goToLoanDetail(loan._id, clientId),
      });
      generalLoansMount.appendChild(card);
    });
  };

  const renderMonth = () => {
    const label = new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(
      new Date(monthYear, monthIndex, 1)
    );
    monthLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);

    const prestamosDelMes = loans.filter((l) => {
      const d = new Date(l.createdAt);
      return d.getFullYear() === monthYear && d.getMonth() === monthIndex;
    });

    const pagosDelMes = payments.filter((p) => {
      const d = new Date(p.date);
      return d.getFullYear() === monthYear && d.getMonth() === monthIndex;
    });

    const capitalPrestadoMes = prestamosDelMes.reduce((s, l) => s + l.amount, 0);
    const cobradoMes = pagosDelMes.reduce((s, p) => s + p.amount, 0);

    const monthStatsMount = container.querySelector('#monthStatsMount');
    const monthLoansMount = container.querySelector('#monthLoansMount');
    const monthLoansTitle = container.querySelector('#monthLoansTitle');
    const monthPaymentsMount = container.querySelector('#monthPaymentsMount');
    const monthEmpty = container.querySelector('#monthEmpty');

    monthStatsMount.innerHTML = '';
    monthLoansMount.innerHTML = '';
    monthPaymentsMount.innerHTML = '';

    const tieneData = prestamosDelMes.length > 0 || pagosDelMes.length > 0;
    monthEmpty.style.display = tieneData ? 'none' : 'block';
    if (!tieneData) return;

    const monthStats = createStatsGrid([
      { label: 'Prestamos creados', value: String(prestamosDelMes.length), sub: formatCurrency(capitalPrestadoMes), color: 'var(--accent2)' },
      { label: 'Cobrado del mes', value: formatCurrency(cobradoMes), sub: `${pagosDelMes.length} ${pagosDelMes.length === 1 ? 'pago' : 'pagos'}`, color: 'var(--green)' },
      { label: 'Base prestamos', value: formatCurrency(capitalPrestadoMes), sub: 'Por fecha de creacion', color: 'var(--text)' },
      { label: 'Base pagos', value: formatCurrency(cobradoMes), sub: 'Por fecha de pago', color: 'var(--text)' },
    ]);
    monthStatsMount.appendChild(monthStats);

    let filteredMonthLoans = filterLoans(prestamosDelMes, monthFilter);
    filteredMonthLoans = filterLoansByType(filteredMonthLoans, monthTypeFilter);
    monthLoansTitle.textContent = `${loanFilterTitle(monthFilter)}${monthTypeFilter !== 'all' ? ` · ${loanTypeLabel(monthTypeFilter)}` : ''} (${filteredMonthLoans.length})`;

    if (filteredMonthLoans.length) {
      filteredMonthLoans.forEach((loan) => {
        const card = createLoanCard(loan, {
          showClient: false,
          onViewDetail: () => goToLoanDetail(loan._id, clientId),
        });
        monthLoansMount.appendChild(card);
      });
    } else {
      monthLoansMount.innerHTML = `
        <div class="empty-state" style="padding:20px 10px;">
          <div class="empty-state-title">Sin prestamos para este filtro</div>
        </div>
      `;
    }

    if (pagosDelMes.length) {
      monthPaymentsMount.innerHTML = `
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin:16px 0 10px;">
          Pagos registrados este mes (${pagosDelMes.length})
        </div>
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;padding:8px 14px;border-bottom:1px solid var(--border);background:var(--surface2);">
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Prestamo</div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;text-align:center;">Monto</div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;text-align:right;">Fecha pago</div>
          </div>
          ${pagosDelMes.map((p) => {
            const loan = p.loanId;
            const loanDesc = typeof loan === 'object' && loan
              ? `${formatCurrency(loan.amount)} - ${loanStatusLabel(loan.status)}`
              : 'N/A';
            return `
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;padding:10px 14px;border-bottom:1px solid var(--border);align-items:center;">
                <div style="font-size:11px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${loanDesc}</div>
                <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:var(--green);text-align:center;">${formatCurrency(p.amount)}</div>
                <div style="font-size:11px;color:var(--text2);text-align:right;">${formatDate(p.date)}</div>
              </div>
            `;
          }).join('')}
          <div style="display:flex;justify-content:space-between;padding:10px 14px;background:var(--surface2);align-items:center;">
            <span style="font-size:12px;font-weight:600;color:var(--text2);">Total cobrado</span>
            <span style="font-family:var(--mono);font-size:14px;font-weight:700;color:var(--green);">${formatCurrency(cobradoMes)}</span>
          </div>
        </div>
      `;
    }
  };

  const refreshGeneralFilterUI = () => {
    bindFilterBar(container.querySelector('#generalFilterBar'), generalFilter, (key) => {
      generalFilter = key;
      refreshGeneralFilterUI();
      renderGeneralLoans();
    });
  };

  const refreshGeneralTypeFilterUI = () => {
    bindTypeFilterBar(container.querySelector('#generalTypeFilterBar'), generalTypeFilter, (key) => {
      generalTypeFilter = key;
      refreshGeneralTypeFilterUI();
      renderGeneralLoans();
    });
  };

  const refreshMonthFilterUI = () => {
    bindFilterBar(container.querySelector('#monthFilterBar'), monthFilter, (key) => {
      monthFilter = key;
      refreshMonthFilterUI();
      renderMonth();
    });
  };

  const refreshMonthTypeFilterUI = () => {
    bindTypeFilterBar(container.querySelector('#monthTypeFilterBar'), monthTypeFilter, (key) => {
      monthTypeFilter = key;
      refreshMonthTypeFilterUI();
      renderMonth();
    });
  };

  refreshGeneralFilterUI();
  refreshGeneralTypeFilterUI();
  refreshMonthFilterUI();
  refreshMonthTypeFilterUI();

  renderGeneralLoans();

  chipGeneral.onclick = () => {
    chipGeneral.classList.add('active');
    chipMes.classList.remove('active');
    viewGeneral.style.display = 'block';
    viewMes.style.display = 'none';
  };

  chipMes.onclick = () => {
    chipMes.classList.add('active');
    chipGeneral.classList.remove('active');
    viewGeneral.style.display = 'none';
    viewMes.style.display = 'block';
    renderMonth();
  };

  container.querySelector('#prevMonth').onclick = () => {
    monthIndex -= 1;
    if (monthIndex < 0) {
      monthIndex = 11;
      monthYear -= 1;
    }
    renderMonth();
  };

  container.querySelector('#nextMonth').onclick = () => {
    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      monthYear += 1;
    }
    renderMonth();
  };
}

function renderFilterBar(prefix) {
  return `
    <div id="${prefix}FilterBar" style="display:flex;gap:6px;flex-wrap:nowrap;margin-bottom:8px;align-items:center;overflow:auto;">
      ${LOAN_FILTERS.map((f) => `
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
  `;
}

function renderTypeFilterBar(prefix) {
  return `
    <div id="${prefix}FilterBar" style="display:flex;gap:6px;flex-wrap:nowrap;margin-bottom:16px;align-items:center;overflow:auto;">
      ${TYPE_FILTERS.map((f) => `
        <button data-type-filter="${f.key}" style="
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
  `;
}

function bindFilterBar(el, activeKey, onChange) {
  el.querySelectorAll('[data-filter]').forEach((btn) => {
    const isActive = btn.dataset.filter === activeKey;
    btn.style.background = isActive ? 'var(--accent)' : 'var(--surface)';
    btn.style.color = isActive ? '#fff' : 'var(--text2)';
    btn.onclick = () => onChange(btn.dataset.filter);
  });
}

function bindTypeFilterBar(el, activeKey, onChange) {
  el.querySelectorAll('[data-type-filter]').forEach((btn) => {
    const isActive = btn.dataset.typeFilter === activeKey;
    btn.style.background = isActive ? 'var(--accent)' : 'var(--surface)';
    btn.style.color = isActive ? '#fff' : 'var(--text2)';
    btn.onclick = () => onChange(btn.dataset.typeFilter);
  });
}

function filterLoans(loans, filterKey) {
  let filtered;
  if (filterKey === 'all') filtered = [...loans];
  else if (filterKey === 'overdue') filtered = loans.filter((l) => isOverdue(l.dueDate, l.status));
  else filtered = loans.filter((l) => l.status === filterKey);
  return filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function loanFilterTitle(filterKey) {
  const map = {
    all: 'Todos los prestamos',
    PARTIALLY_PAID: 'Prestamos parciales',
    PENDING: 'Prestamos pendientes',
    PAID: 'Prestamos pagados',
    overdue: 'Prestamos vencidos',
  };
  return map[filterKey] || map.all;
}

function goToLoanDetail(loanId, clientId) {
  window.location.hash = `#loans?id=${loanId}&back=client:${clientId}`;
  window.dispatchEvent(new CustomEvent('navigate'));
}