import { createLayout } from '../components/Layout.js';
import { debtService } from '../services/debt.service.js';
import { icons, icon } from '../components/Icons.js';
import { formatCurrency, formatDate, calcProgress, isOverdue, loanTypeIcon, loanTypeLabel, loanTypeColor } from '../utility/helpers.js';

const STATUS_FILTERS = [
  { key: 'all', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
  { key: 'PARTIALLY_PAID', label: 'Parcial' },
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

let currentPage = 1;
const ITEMS_PER_PAGE = 5;

export async function renderDebts() {
  document.body.innerHTML = '';
  const container = createLayout('debts', 'Mis deudas');
  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  try {
    const debts = await debtService.getMyDebts();
    renderDebtsPage(container, debts);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} ${err.message}</div>`;
  }
}

async function renderDebtsPage(container, debts) {
  let activeFilter = 'all';
  let activeTypeFilter = 'all';
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const focusDebtId = params.get('id');
  let focusDone = false;
  const totalDeuda = debts.reduce((s, d) => s + d.total, 0);
  const totalPagado = debts.reduce((s, d) => s + d.amountPaid, 0);
  const totalPendiente = debts.reduce((s, d) => s + (d.total - d.amountPaid), 0);
  const vencidas = debts.filter(d => isOverdue(d.dueDate, d.status));

  container.innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
      <div>
        <h1 class="page-title">Mis deudas</h1>
        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
          <p class="page-subtitle" style="margin:0;">${debts.length} ${debts.length === 1 ? 'préstamo registrado' : 'préstamos registrados'} a tu nombre</p>
          <div style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;font-size:11px;color:var(--text3);">
            ${icons.eye} Solo lectura
          </div>
        </div>
      </div>
    </div>

    ${vencidas.length > 0 ? `
      <div class="alert alert-error" style="margin-bottom:16px;">
        <span style="color:var(--yellow);display:inline-flex;align-items:center;flex-shrink:0;">${icons.alert}</span>
        <div><strong>${vencidas.length} ${vencidas.length === 1 ? 'préstamo vencido.' : 'préstamos vencidos.'}</strong> Contacta a tu prestamista para regularizar.</div>
      </div>
    ` : ''}

    <!-- Stats 2x2 -->
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Deuda total</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--red);">${formatCurrency(totalDeuda)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">${debts.length} préstamos</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Pendiente</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--yellow);">${formatCurrency(totalPendiente)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">Por pagar</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Ya pagado</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--green);">${formatCurrency(totalPagado)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">Total abonado</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Vencidos</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:${vencidas.length > 0 ? 'var(--red)' : 'var(--green)'};">${vencidas.length}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;display:flex;align-items:center;justify-content:center;gap:4px;">
          ${vencidas.length === 0 ? `${icons.check} <span>Todo al dia</span>` : 'Requieren atencion'}
        </div>
      </div>
    </div>

    <!-- Filtros de estado -->
    <div id="debtFilterBar" style="display:flex;gap:6px;flex-wrap:nowrap;margin-bottom:12px;align-items:center;overflow-x:auto;padding-bottom:4px;">
      ${STATUS_FILTERS.map((f) => `
        <button data-filter="${f.key}" style="
          padding:6px 12px;
          border-radius:20px;
          font-size:12px;
          font-weight:600;
          border:1.5px solid ${activeFilter === f.key ? 'var(--accent)' : 'var(--border)'};
          background:${activeFilter === f.key ? 'var(--accent)' : 'var(--surface)'};
          color:${activeFilter === f.key ? '#fff' : 'var(--text2)'};
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

    <!-- Filtros por tipo de préstamo -->
    <div style="display:flex;gap:6px;flex-wrap:nowrap;margin-bottom:14px;align-items:center;overflow-x:auto;padding-bottom:4px;">
      ${TYPE_FILTERS.map(f => `
        <button data-type-filter="${f.key}" style="
          padding:6px 12px;
          border-radius:20px;
          font-size:12px;
          font-weight:600;
          border:1.5px solid ${activeTypeFilter === f.key ? 'var(--accent)' : 'var(--border)'};
          background:${activeTypeFilter === f.key ? 'var(--accent)' : 'var(--surface)'};
          color:${activeTypeFilter === f.key ? '#fff' : 'var(--text2)'};
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

    <!-- Lista de deudas -->
    <div id="debtsList"></div>
    <div id="pagination" style="display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap;"></div>

    <div id="emptyDebts" class="empty-state" style="display:none;">
      <div class="empty-state-icon">${icons.debtBox}</div>
      <div class="empty-state-title">Sin deudas registradas</div>
      <div class="empty-state-desc">No tienes préstamos a tu nombre en este momento</div>
    </div>
  `;

  const listEl = container.querySelector('#debtsList');
  const emptyEl = container.querySelector('#emptyDebts');
  const filterBar = container.querySelector('#debtFilterBar');
  const paginationEl = container.querySelector('#pagination');

  if (!debts.length) {
    emptyEl.style.display = 'block';
    paginationEl.innerHTML = '';
    return;
  }

  function filterDebtsData(data, filterKey, typeKey) {
    let result = [...data];
    if (filterKey === 'overdue') result = result.filter((d) => isOverdue(d.dueDate, d.status));
    else if (filterKey !== 'all') result = result.filter((d) => d.status === filterKey);
    if (typeKey !== 'all') result = result.filter((d) => (d.loanType || 'NORMAL') === typeKey);
    return result;
  }

  function paintFilterBar() {
    filterBar.querySelectorAll('[data-filter]').forEach((btn) => {
      const isActive = btn.dataset.filter === activeFilter;
      btn.style.background = isActive ? 'var(--accent)' : 'var(--surface)';
      btn.style.color = isActive ? '#fff' : 'var(--text2)';
      btn.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
    });
  }

  function paintTypeFilterBar() {
    container.querySelectorAll('[data-type-filter]').forEach((btn) => {
      const isActive = btn.dataset.typeFilter === activeTypeFilter;
      btn.style.background = isActive ? 'var(--accent)' : 'var(--surface)';
      btn.style.color = isActive ? '#fff' : 'var(--text2)';
      btn.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
    });
  }

  function statBlock(label, value, color) {
    return `
      <div style="padding:8px 6px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">${label}</div>
        <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:${color};white-space:nowrap;">${value}</div>
      </div>
    `;
  }

  function renderAmountsBlock(debt) {
    const loanType = debt.loanType || 'NORMAL';

    if (loanType === 'FIXED_INTEREST') {
      const capitalPendiente = debt.capitalPendiente ?? 0;
      const interesesPendientes = debt.interesesPendientes ?? 0;
      const totalAdeudado = capitalPendiente + interesesPendientes;
      let proximaFecha = null;
      if (debt.ultimaGeneracionIntereses) {
        const fecha = new Date(debt.ultimaGeneracionIntereses);
        fecha.setUTCMonth(fecha.getUTCMonth() + 1);
        proximaFecha = fecha;
      }

      return `
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:8px;">
          ${statBlock('Capital original', formatCurrency(debt.capitalOriginal ?? 0), 'var(--text)')}
          ${statBlock('Capital pendiente', formatCurrency(capitalPendiente), 'var(--text)')}
          ${statBlock('Interés mensual', formatCurrency(debt.interesMensual ?? 0), 'var(--yellow)')}
          ${statBlock('Interés pendiente', formatCurrency(interesesPendientes), 'var(--yellow)')}
        </div>
        <div style="padding:8px 10px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;">Próximo interés</span>
          <span style="font-family:var(--mono);font-size:12px;font-weight:700;color:${proximaFecha ? 'var(--yellow)' : 'var(--text3)'};">${proximaFecha ? formatDate(proximaFecha) : '—'}</span>
        </div>
        <div style="padding:8px 10px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;">Total adeudado hoy</span>
          <span style="font-family:var(--mono);font-size:14px;font-weight:800;color:${totalAdeudado > 0 ? 'var(--red)' : 'var(--green)'};">${formatCurrency(totalAdeudado)}</span>
        </div>
      `;
    }

    if (loanType === 'INSTALLMENTS') {
      return `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px;">
          ${statBlock('Capital', formatCurrency(debt.capitalOriginal ?? debt.amount ?? 0), 'var(--text)')}
          ${statBlock('Interés', `${debt.porcentajeInteres ?? 0}%/mes`, 'var(--yellow)')}
          ${statBlock('Cuota', formatCurrency(debt.cuotaMensual ?? 0), 'var(--accent2)')}
          ${statBlock('Total', formatCurrency(debt.totalAPagar ?? debt.total ?? 0), 'var(--text)')}
        </div>
        ${debt.fechaPrimerPago && debt.fechaUltimoPago ? `
          <div style="padding:8px 10px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:12px;display:flex;justify-content:space-between;font-size:11px;color:var(--text2);">
            <span>1er pago: <strong style="color:var(--text);">${formatDate(debt.fechaPrimerPago)}</strong></span>
            <span>Último: <strong style="color:var(--text);">${formatDate(debt.fechaUltimoPago)}</strong></span>
          </div>
        ` : ''}
      `;
    }

    return `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px;">
        ${statBlock('Capital', formatCurrency(debt.amount), 'var(--text)')}
        ${statBlock('Interés', formatCurrency(debt.interest), 'var(--yellow)')}
        ${statBlock('Total', formatCurrency(debt.total), 'var(--text)')}
        ${statBlock('Pendiente', formatCurrency(debt.total - debt.amountPaid), (debt.total - debt.amountPaid) > 0 ? 'var(--red)' : 'var(--green)')}
      </div>
    `;
  }

  function renderDebtCard(debt) {
    const loanType = debt.loanType || 'NORMAL';
    const isFixedInterest = loanType === 'FIXED_INTEREST';
    const progress = calcProgress(debt.amountPaid, debt.total);
    const overdue = isOverdue(debt.dueDate, debt.status);

    const lenderAvatar = debt.lender?.avatar
      ? `<img src="${debt.lender.avatar.startsWith('data:') ? debt.lender.avatar : `data:image/jpeg;base64,${debt.lender.avatar}`}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
      : `<div class="user-avatar" style="width:36px;height:36px;font-size:13px;flex-shrink:0;">${(debt.lender?.name || '?').slice(0,2).toUpperCase()}</div>`;

    const statusColors = {
      PENDING: { bg: 'var(--yellow-bg)', color: 'var(--yellow)', label: 'Pendiente' },
      PARTIALLY_PAID: { bg: 'var(--accent-glow)', color: 'var(--accent2)', label: 'Parcial' },
      PAID: { bg: 'var(--green-bg)', color: 'var(--green)', label: 'Pagado' },
    };
    const st = statusColors[debt.status] || statusColors.PENDING;

    const loanTypeBadgeHTML = loanType !== 'NORMAL' ? `
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;color:var(--text2);background:var(--surface2);padding:3px 8px;border-radius:20px;border:1px solid var(--border);margin-top:4px;">
        <span style="display:inline-flex;color:${loanTypeColor(loanType)};">${icon(loanTypeIcon(loanType), 12)}</span> ${loanTypeLabel(loanType)}
      </span>
    ` : '';

    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.debtId = debt._id;
    card.style.marginBottom = '12px';
    card.style.position = 'relative';
    card.style.overflow = 'hidden';

    const borderColor = debt.status === 'PAID' ? 'var(--green)' : overdue ? 'var(--red)' : debt.status === 'PARTIALLY_PAID' ? 'var(--accent)' : 'var(--yellow)';
    card.style.borderLeft = `3px solid ${borderColor}`;

    card.innerHTML = `
      <!-- Header: prestamista + estado -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        ${lenderAvatar}
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;color:var(--text3);margin-bottom:1px;text-transform:uppercase;letter-spacing:0.05em;">Prestamista</div>
          <div style="font-size:14px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${debt.lender?.name || 'Usuario'}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:1px;">${debt.lender?.email || debt.lender?.phone || ''}</div>
          ${loanTypeBadgeHTML}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${st.bg};color:${st.color};">${st.label}</span>
          ${overdue && debt.status !== 'PAID' ? `<span style="font-size:10px;color:var(--red);font-weight:600;display:inline-flex;align-items:center;gap:4px;">${icons.alert} Vencido</span>` : ''}
        </div>
      </div>

      <!-- Montos -->
      ${renderAmountsBlock(debt)}

      <!-- Barra de progreso -->
      ${!isFixedInterest ? `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:4px;">
            <span>Pagado</span>
            <span style="font-weight:600;color:var(--text);">${progress}%</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill ${debt.status === 'PAID' ? 'paid' : debt.status === 'PARTIALLY_PAID' ? 'partial' : ''}" style="width:${progress}%;"></div>
          </div>
        </div>
      ` : ''}

      <!-- Fechas -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${!isFixedInterest ? `
          <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text3);">
            ${icons.calendar}
            <span>Vence: <strong style="color:${overdue && debt.status !== 'PAID' ? 'var(--red)' : 'var(--text2)'};">${formatDate(debt.dueDate)}</strong></span>
          </div>
        ` : ''}
        ${debt.description ? `
          <div style="width:100%;margin-top:4px;padding:8px 10px;background:var(--surface2);border-radius:var(--radius-sm);font-size:11px;color:var(--text3);line-height:1.4;">
            <span style="font-weight:600;color:var(--text2);">Motivo: </span>${debt.description}
          </div>
        ` : ''}
      </div>

      <!-- Toggle pagos -->
      <button class="btn btn-ghost btn-sm" data-toggle-payments="${debt._id}" style="margin-top:10px;width:100%;justify-content:center;border:1px solid var(--border);font-size:12px;">
        ${icons.payments} Ver historial de pagos
      </button>
      <div id="payments-${debt._id}" style="display:none;margin-top:10px;"></div>
    `;

    card.querySelector(`[data-toggle-payments="${debt._id}"]`).onclick = async (e) => {
      const btn = e.currentTarget;
      const payEl = card.querySelector(`#payments-${debt._id}`);
      const isOpen = payEl.style.display !== 'none' && payEl.style.display !== '';

      if (isOpen) {
        payEl.style.display = 'none';
        btn.innerHTML = `${icons.payments} Ver historial de pagos`;
        return;
      }

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner spinner-dark"></span> Cargando...`;

      try {
        const payments = await debtService.getPayments(debt._id);
        renderPaymentHistory(payEl, payments, isFixedInterest);
        payEl.style.display = 'block';
        btn.innerHTML = `${icons.payments} Ocultar historial`;
      } catch (err) {
        payEl.innerHTML = `<div style="font-size:12px;color:var(--red);padding:8px;">Error al cargar pagos</div>`;
        payEl.style.display = 'block';
        btn.innerHTML = `${icons.payments} Ver historial de pagos`;
      } finally {
        btn.disabled = false;
      }
    };

    return card;
  }

  function renderDebtList() {
    listEl.innerHTML = '';
    const filtered = filterDebtsData(debts, activeFilter, activeTypeFilter)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    if (!filtered.length) {
      emptyEl.style.display = 'block';
      emptyEl.querySelector('.empty-state-title').textContent = 'Sin resultados para este filtro';
      emptyEl.querySelector('.empty-state-desc').textContent = 'No hay deudas que coincidan ahora';
      paginationEl.innerHTML = '';
      return;
    }

    emptyEl.style.display = 'none';

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, filtered.length);
    const pageData = filtered.slice(start, end);

    const sectionLabel = document.createElement('div');
    sectionLabel.style.cssText = 'font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:10px;';
    sectionLabel.textContent = `Resultados (${filtered.length})`;
    listEl.appendChild(sectionLabel);
    pageData.forEach((d) => listEl.appendChild(renderDebtCard(d)));

    paginationEl.innerHTML = '';
    if (totalPages > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'btn btn-ghost btn-sm';
      prevBtn.innerHTML = icons.arrowLeft;
      prevBtn.style.padding = '6px 10px';
      prevBtn.style.border = '1px solid var(--border)';
      prevBtn.style.background = 'var(--surface)';
      prevBtn.disabled = currentPage === 1;
      prevBtn.style.opacity = currentPage === 1 ? '0.4' : '1';
      prevBtn.onclick = () => {
        if (currentPage > 1) {
          currentPage--;
          renderDebtList();
        }
      };
      paginationEl.appendChild(prevBtn);

      const maxVisible = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
      if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'btn btn-sm';
        pageBtn.textContent = i;
        pageBtn.style.background = i === currentPage ? 'var(--accent)' : 'var(--surface)';
        pageBtn.style.color = i === currentPage ? '#fff' : 'var(--text2)';
        pageBtn.style.border = i === currentPage ? 'none' : '1px solid var(--border)';
        pageBtn.style.padding = '6px 12px';
        pageBtn.style.borderRadius = 'var(--radius-sm)';
        pageBtn.style.fontWeight = i === currentPage ? '700' : '400';
        pageBtn.onclick = () => {
          currentPage = i;
          renderDebtList();
        };
        paginationEl.appendChild(pageBtn);
      }

      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-ghost btn-sm';
      nextBtn.innerHTML = icons.arrowRight;
      nextBtn.style.padding = '6px 10px';
      nextBtn.style.border = '1px solid var(--border)';
      nextBtn.style.background = 'var(--surface)';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.style.opacity = currentPage === totalPages ? '0.4' : '1';
      nextBtn.onclick = () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderDebtList();
        }
      };
      paginationEl.appendChild(nextBtn);
    }

    if (focusDebtId && !focusDone) {
      const target = listEl.querySelector(`[data-debt-id="${focusDebtId}"]`);
      if (target) {
        focusDone = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.style.boxShadow = '0 0 0 2px rgba(108,99,255,0.45)';
        setTimeout(() => {
          target.style.boxShadow = '';
        }, 1800);
      }
    }
  }

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    currentPage = 1;
    paintFilterBar();
    renderDebtList();
  });

  container.querySelectorAll('[data-type-filter]').forEach((btn) => {
    btn.onclick = () => {
      activeTypeFilter = btn.dataset.typeFilter;
      currentPage = 1;
      paintTypeFilterBar();
      renderDebtList();
    };
  });

  paintFilterBar();
  paintTypeFilterBar();
  renderDebtList();
}

function renderPaymentHistory(el, payments, isFixedInterest = false) {
  if (!payments.length) {
    el.innerHTML = `
      <div style="text-align:center;padding:16px;color:var(--text3);font-size:13px;background:var(--surface2);border-radius:var(--radius-sm);">
        Sin pagos registrados aún
      </div>
    `;
    return;
  }

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const money = (n) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);
  const dateFmt = (d) => new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

  const gridCols = isFixedInterest ? '24px 1fr 1fr 1fr 1fr' : '24px 1fr 1fr';

  el.innerHTML = `
    <div style="background:var(--surface2);border-radius:var(--radius-sm);overflow:hidden;">
      <div style="display:grid;grid-template-columns:${gridCols};gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">#</div>
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Monto</div>
        ${isFixedInterest ? `
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;text-align:center;">A interés</div>
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;text-align:center;">A capital</div>
        ` : ''}
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;text-align:right;">Fecha</div>
      </div>
      ${payments.map((p, i) => `
        <div style="display:grid;grid-template-columns:${gridCols};gap:8px;padding:10px 12px;border-bottom:1px solid var(--border);align-items:center;">
          <div style="font-size:11px;color:var(--text3);font-family:var(--mono);">${i + 1}</div>
          <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:var(--green);">${money(p.amount)}</div>
          ${isFixedInterest ? `
            <div style="font-family:var(--mono);font-size:12px;font-weight:600;color:var(--yellow);text-align:center;">${money(p.appliedToInterest ?? 0)}</div>
            <div style="font-family:var(--mono);font-size:12px;font-weight:600;color:var(--text);text-align:center;">${money(p.appliedToCapital ?? 0)}</div>
          ` : ''}
          <div style="font-size:11px;color:var(--text2);text-align:right;">${dateFmt(p.date)}</div>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;padding:10px 12px;background:var(--surface);align-items:center;">
        <span style="font-size:12px;font-weight:600;color:var(--text2);">Total pagado</span>
        <span style="font-family:var(--mono);font-size:14px;font-weight:700;color:var(--green);">${money(total)}</span>
      </div>
    </div>
  `;
}