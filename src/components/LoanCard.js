import { icons, icon } from './Icons.js';
import { formatCurrency, calcProgress, isOverdue, loanStatusClass, loanStatusLabel, loanTypeIcon, loanTypeLabel, loanTypeColor } from '../utility/helpers.js';

/**
 * LoanCard — tarjeta de préstamo reutilizable.
 * Usada en Loans.js y ClientProfile.js.
 *
 * @param {object} loan
 * @param {object} opts
 * @param {boolean}  opts.showClient
 * @param {Function} opts.onViewDetail
 * @param {Function} opts.onEdit
 * @param {Function} opts.onDelete
 * @param {Function} opts.onRegisterPay
 * @param {Function} opts.onViewPayments
 * @returns {HTMLElement}
 */
export function createLoanCard(loan, opts = {}) {
  const {
    showClient = true,
    onViewDetail = null,
    onEdit = null,
    onDelete = null,
    onRegisterPay = null,
  } = opts;

  const overdue = isOverdue(loan.dueDate, loan.status);
  const progress = calcProgress(loan.amountPaid, loan.total);
  const client = loan.clientId;
  const startDateShort = shortDate(loan.createdAt || loan.dueDate);
  const dueDateShort = shortDate(loan.dueDate);
  const loanType = loan.loanType || 'NORMAL';
  const isFixedInterest = loanType === 'FIXED_INTEREST';

  // 👇 Calcular fecha de próximo interés para FIXED_INTEREST
  let proximaInteresShort = null;
  if (isFixedInterest && loan.ultimaGeneracionIntereses) {
    const fecha = new Date(loan.ultimaGeneracionIntereses);
    fecha.setMonth(fecha.getMonth() + 1);
    proximaInteresShort = shortDate(fecha.toISOString());
  }

  const avatarHTML = client?.avatar
    ? `<img src="${client.avatar.startsWith('data:') ? client.avatar : `data:image/jpeg;base64,${client.avatar}`}"
        style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
    : `<div style="width:40px;height:40px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;">
        ${(client?.name || '?').slice(0, 2).toUpperCase()}
      </div>`;

  const statusBorderColor =
    loan.status === 'PAID'
      ? 'var(--green)'
      : overdue
      ? 'var(--red)'
      : loan.status === 'PARTIALLY_PAID'
      ? 'var(--accent)'
      : 'var(--yellow)';

  // 👇 NUEVO: badge de tipo de préstamo (no afecta el resto de la tarjeta)
  const loanTypeBadgeHTML = loanType !== 'NORMAL' ? `
    <span title="${loanTypeLabel(loanType)}" style="flex-shrink:0;display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;color:var(--text2);background:var(--surface2);padding:3px 8px;border-radius:20px;border:1px solid var(--border);">
      <span style="display:inline-flex;color:${loanTypeColor(loanType)};">${icon(loanTypeIcon(loanType), 12)}</span> ${loanTypeLabel(loanType)}
    </span>
  ` : '';

  // 👇 NUEVO: bloque financiero extra SOLO para interés fijo
  // Muestra capital pendiente, intereses pendientes y total adeudado.
const fixedInterestBlockHTML = isFixedInterest ? `
    <div style="display:grid;width:100%;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:8px;margin-bottom:12px;box-sizing:border-box;">
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:8px;text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Capital pend.</div>
        <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--text);">${formatCurrency(loan.capitalPendiente ?? 0)}</div>
      </div>
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:8px;text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Interés pend.</div>
        <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--yellow);">${formatCurrency(loan.interesesPendientes ?? 0)}</div>
      </div>
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:8px;text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Total adeudado</div>
        <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--red);">${formatCurrency((loan.capitalPendiente ?? 0) + (loan.interesesPendientes ?? 0))}</div>
      </div>
    </div>
  ` : '';

  const card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = `margin-bottom:14px;border-left:3px solid ${statusBorderColor};`;

  card.innerHTML = `
    <!-- Header cliente + estado -->
    ${showClient ? `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      ${avatarHTML}
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${client?.name || '—'}
        </div>
        <div style="font-size:10px;color:var(--text3);margin-top:1px;display:flex;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          <span>Inicio: ${startDateShort}</span>
          ${isFixedInterest 
            ? `<span>Próximo interés: ${proximaInteresShort || '--'}</span>` 
            : `<span>Vence: ${dueDateShort}</span>`}
        </div>
      </div>
      ${loanTypeBadgeHTML}
      <span class="${loanStatusClass(loan.status)}">${loanStatusLabel(loan.status)}</span>
    </div>
    ` : `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;">
      <div style="font-size:10px;color:var(--text3);display:flex;gap:6px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        <span>Inicio: ${startDateShort}</span>
        ${isFixedInterest 
          ? `<span>Próximo interés: ${proximaInteresShort || '--'}</span>` 
          : `<span>Vence: ${dueDateShort}</span>`}
      </div>
      ${loanTypeBadgeHTML}
      <span class="${loanStatusClass(loan.status)}">${loanStatusLabel(loan.status)}</span>
    </div>
    `}

    ${fixedInterestBlockHTML}

    <!-- Stats 4 columnas (préstamos NORMAL/INSTALLMENTS mantienen esta vista tal cual) -->
    ${!isFixedInterest ? `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:8px;text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Capital</div>
        <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--text);">${formatCurrency(loan.amount)}</div>
      </div>
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:8px;text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Interes</div>
        <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--yellow);">${formatCurrency(loan.interest)}</div>
      </div>
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:8px;text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Total</div>
        <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--text);">${formatCurrency(loan.total)}</div>
      </div>
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:8px;text-align:center;">
        <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Cobrado</div>
        <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--green);">${formatCurrency(loan.amountPaid)}</div>
      </div>
    </div>
    ` : ''}

    <!-- Barra de progreso (se omite para interés fijo: no tiene "total" fijo con el que progresar) -->
    ${!isFixedInterest ? `
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:4px;">
        <span>Progreso</span>
        <span style="font-weight:600;color:var(--text);">${progress}%</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill ${loan.status === 'PAID' ? 'paid' : loan.status === 'PARTIALLY_PAID' ? 'partial' : ''}"
          style="width:${progress}%;"></div>
      </div>
    </div>
    ` : ''}

    <!-- Descripcion -->
    ${loan.description ? `
    <div style="font-size:11px;color:var(--text3);padding:7px 10px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:12px;line-height:1.4;">
      <span style="font-weight:600;color:var(--text2);">Motivo: </span>${loan.description}
    </div>
    ` : ''}

    <!-- Acciones -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      ${onRegisterPay ? `
      <button class="btn btn-sm js-register-pay" style="flex:1;background:var(--green-strong);color:#fff;border:none;">
        ${icons.plus} Registrar pagos
      </button>
      ` : ''}
      ${onViewDetail ? `
      <button class="btn btn-secondary btn-sm js-view-detail" style="flex:1;">
        ${icons.eye} Ver detalles
      </button>
      ` : ''}
      ${onEdit ? `
      <button class="btn btn-ghost btn-icon js-edit" title="Editar">${icons.edit}</button>
      ` : ''}
      ${onDelete ? `
      <button class="btn btn-ghost btn-icon js-delete" style="color:var(--red);" title="Eliminar">${icons.trash}</button>
      ` : ''}
    </div>
  `;

  // Vincular eventos
  card.querySelector('.js-register-pay')?.addEventListener('click', () => onRegisterPay(loan));
  card.querySelector('.js-view-detail')?.addEventListener('click', () => onViewDetail(loan));
  card.querySelector('.js-edit')?.addEventListener('click', () => onEdit(loan));
  card.querySelector('.js-delete')?.addEventListener('click', () => onDelete(loan));

  return card;
}

function shortDate(value) {
  if (!value) return '--/--/--';
  const s = typeof value === 'string' ? value : new Date(value).toISOString();
  const datePart = s.slice(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return '--/--/--';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
} 