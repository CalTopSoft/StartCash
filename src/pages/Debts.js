import { createLayout } from '../components/Layout.js';
import { debtService } from '../services/debt.service.js';
import { icons } from '../components/Icons.js';
import { formatCurrency, formatDate, calcProgress, isOverdue } from '../utility/helpers.js';

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
  const totalDeuda = debts.reduce((s, d) => s + d.total, 0);
  const totalPagado = debts.reduce((s, d) => s + d.amountPaid, 0);
  const totalPendiente = debts.reduce((s, d) => s + (d.total - d.amountPaid), 0);
  const vencidas = debts.filter(d => isOverdue(d.dueDate, d.status));

  container.innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <div>
        <h1 class="page-title">Mis deudas</h1>
        <p class="page-subtitle">${debts.length} ${debts.length === 1 ? 'préstamo registrado' : 'préstamos registrados'} a tu nombre</p>
      </div>
      <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;font-size:12px;color:var(--text3);">
        ${icons.eye} Solo lectura
      </div>
    </div>

    ${vencidas.length > 0 ? `
      <div class="alert alert-error" style="margin-bottom:16px;">
        ${icons.alert}
        <div><strong>${vencidas.length} ${vencidas.length === 1 ? 'préstamo vencido.' : 'préstamos vencidos.'}</strong> Contacta a tu prestamista para regularizar.</div>
      </div>
    ` : ''}

    <!-- Stats 2x2 -->
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Deuda total</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--red);">${formatCurrency(totalDeuda)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">${debts.length} préstamos</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Pendiente</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--yellow);">${formatCurrency(totalPendiente)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">Por pagar</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Ya pagado</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--green);">${formatCurrency(totalPagado)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">Total abonado</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Vencidos</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:${vencidas.length > 0 ? 'var(--red)' : 'var(--green)'};">${vencidas.length}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">${vencidas.length === 0 ? 'Todo al día ✓' : 'Requieren atención'}</div>
      </div>
    </div>

    <!-- Lista de deudas -->
    <div id="debtsList"></div>

    <div id="emptyDebts" class="empty-state" style="display:none;">
      <div class="empty-state-icon">${icons.debtBox}</div>
      <div class="empty-state-title">Sin deudas registradas</div>
      <div class="empty-state-desc">No tienes préstamos a tu nombre en este momento</div>
    </div>
  `;

  const listEl = container.querySelector('#debtsList');
  const emptyEl = container.querySelector('#emptyDebts');

  if (!debts.length) {
    emptyEl.style.display = 'block';
    return;
  }

  // Separar activos y pagados
  const activos = debts.filter(d => d.status !== 'PAID');
  const pagados = debts.filter(d => d.status === 'PAID');

  function renderDebtCard(debt) {
    const progress = calcProgress(debt.amountPaid, debt.total);
    const overdue = isOverdue(debt.dueDate, debt.status);
    const remaining = debt.total - debt.amountPaid;

    const lenderAvatar = debt.lender?.avatar
      ? `<img src="${debt.lender.avatar.startsWith('data:') ? debt.lender.avatar : `data:image/jpeg;base64,${debt.lender.avatar}`}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
      : `<div class="user-avatar" style="width:36px;height:36px;font-size:13px;flex-shrink:0;">${(debt.lender?.name || '?').slice(0,2).toUpperCase()}</div>`;

    const statusColors = {
      PENDING: { bg: 'var(--yellow-bg)', color: 'var(--yellow)', label: 'Pendiente' },
      PARTIALLY_PAID: { bg: 'var(--accent-glow)', color: 'var(--accent2)', label: 'Parcial' },
      PAID: { bg: 'var(--green-bg)', color: 'var(--green)', label: 'Pagado' },
    };
    const st = statusColors[debt.status] || statusColors.PENDING;

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '12px';
    card.style.position = 'relative';
    card.style.overflow = 'hidden';

    // Borde izquierdo de color según estado
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
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${st.bg};color:${st.color};">${st.label}</span>
          ${overdue && debt.status !== 'PAID' ? `<span style="font-size:10px;color:var(--red);font-weight:600;">⚠ Vencido</span>` : ''}
        </div>
      </div>

      <!-- Montos 4 col -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px;">
        <div style="padding:8px 6px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Capital</div>
          <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--text);">${formatCurrency(debt.amount)}</div>
        </div>
        <div style="padding:8px 6px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Interés</div>
          <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--yellow);">${formatCurrency(debt.interest)}</div>
        </div>
        <div style="padding:8px 6px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Total</div>
          <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--text);">${formatCurrency(debt.total)}</div>
        </div>
        <div style="padding:8px 6px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Pendiente</div>
          <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:${remaining > 0 ? 'var(--red)' : 'var(--green)'};">${formatCurrency(remaining)}</div>
        </div>
      </div>

      <!-- Barra de progreso -->
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:4px;">
          <span>Pagado</span>
          <span style="font-weight:600;color:var(--text);">${progress}%</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill ${debt.status === 'PAID' ? 'paid' : debt.status === 'PARTIALLY_PAID' ? 'partial' : ''}" style="width:${progress}%;"></div>
        </div>
      </div>

      <!-- Fechas -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text3);">
          ${icons.calendar}
          <span>Vence: <strong style="color:${overdue && debt.status !== 'PAID' ? 'var(--red)' : 'var(--text2)'};">${formatDate(debt.dueDate)}</strong></span>
        </div>
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

    // Toggle pagos
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
        renderPaymentHistory(payEl, payments);
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

  // Render activos
  if (activos.length) {
    const sectionLabel = document.createElement('div');
    sectionLabel.style.cssText = 'font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:10px;';
    sectionLabel.textContent = `Activos (${activos.length})`;
    listEl.appendChild(sectionLabel);
    activos.forEach(d => listEl.appendChild(renderDebtCard(d)));
  }

  // Render pagados
  if (pagados.length) {
    const sectionLabel = document.createElement('div');
    sectionLabel.style.cssText = 'font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin:16px 0 10px;';
    sectionLabel.textContent = `Pagados (${pagados.length})`;
    listEl.appendChild(sectionLabel);
    pagados.forEach(d => listEl.appendChild(renderDebtCard(d)));
  }
}

function renderPaymentHistory(el, payments) {
  if (!payments.length) {
    el.innerHTML = `
      <div style="text-align:center;padding:16px;color:var(--text3);font-size:13px;background:var(--surface2);border-radius:var(--radius-sm);">
        Sin pagos registrados aún
      </div>
    `;
    return;
  }

  const total = payments.reduce((s, p) => s + p.amount, 0);

  el.innerHTML = `
    <div style="background:var(--surface2);border-radius:var(--radius-sm);overflow:hidden;">
      <!-- Header tabla -->
      <div style="display:grid;grid-template-columns:24px 1fr 1fr;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">#</div>
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Monto</div>
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;text-align:right;">Fecha</div>
      </div>
      ${payments.map((p, i) => `
        <div style="display:grid;grid-template-columns:24px 1fr 1fr;gap:8px;padding:10px 12px;border-bottom:1px solid var(--border);align-items:center;">
          <div style="font-size:11px;color:var(--text3);font-family:var(--mono);">${i + 1}</div>
          <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:var(--green);">${new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(p.amount)}</div>
          <div style="font-size:11px;color:var(--text2);text-align:right;">${new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(p.date))}</div>
        </div>
      `).join('')}
      <!-- Total -->
      <div style="display:flex;justify-content:space-between;padding:10px 12px;background:var(--surface);align-items:center;">
        <span style="font-size:12px;font-weight:600;color:var(--text2);">Total pagado</span>
        <span style="font-family:var(--mono);font-size:14px;font-weight:700;color:var(--green);">${new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(total)}</span>
      </div>
    </div>
  `;
}