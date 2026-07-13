import { createLayout } from '../components/Layout.js';
import { loanService } from '../services/loan.service.js';
import { paymentService } from '../services/payment.service.js';
import { createModal, confirmDialog } from '../components/Modal.js';
import { inputGroup, showFieldError, clearFieldErrors } from '../components/FormBuilder.js';
import { toast } from '../components/Toast.js';
import { icons, icon } from '../components/Icons.js';
import { formatCurrency, formatDate, formatDateInput, loanStatusClass, loanStatusLabel, calcProgress, isOverdue, loanTypeIcon, loanTypeLabel, loanTypeColor } from '../utility/helpers.js';
import { FIELD_LIMITS, validateNumberRange } from '../utility/validation.js';
import { openReceiptExportModal } from '../utility/receipts/loanReceipt.js';


export async function renderLoanDetail(loanId, backTarget = null) {
  document.body.innerHTML = '';
  const container = createLayout('loans', 'Detalle de prestamo');
  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  try {
    const [loan, payments] = await Promise.all([
      loanService.getOne(loanId),
      paymentService.listByLoan(loanId),
    ]);
    renderDetail(container, loan, payments, loanId, backTarget);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} ${err.message}</div>`;
  }
}

function renderDetail(container, loan, payments, loanId, backTarget = null) {
  const progress = calcProgress(loan.amountPaid, loan.total);
  const overdue = isOverdue(loan.dueDate, loan.status);
  const remaining = loan.total - loan.amountPaid;
  const loanType = loan.loanType || 'NORMAL';
  const isFixedInterest = loanType === 'FIXED_INTEREST';
  const isInstallments = loanType === 'INSTALLMENTS';

  const clientAvatar = loan.clientId?.avatar
    ? `<img src="${loan.clientId.avatar.startsWith('data:') ? loan.clientId.avatar : `data:image/jpeg;base64,${loan.clientId.avatar}`}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
    : `<div class="user-avatar" style="width:32px;height:32px;font-size:12px;flex-shrink:0;">${(loan.clientId?.name || '?').slice(0,2).toUpperCase()}</div>`;

  // Resumen financiero específico por tipo de préstamo
  const financialSummaryHTML = renderFinancialSummary(loan, loanType, payments);

  container.innerHTML = `
    <!-- Header compacto -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
      <button class="btn btn-ghost btn-icon" id="backBtn" style="flex-shrink:0;">${icons.arrowLeft}</button>
      <div style="flex:1;min-width:0;">
        <h1 style="font-size:16px;font-weight:700;color:var(--text);line-height:1.2;">Detalle de prestamo</h1>
        <p style="font-size:11px;color:var(--text3);">Historial y pagos</p>
      </div>
      ${loanType !== 'NORMAL' ? `
        <span style="flex-shrink:0;display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--text2);background:var(--surface2);padding:4px 10px;border-radius:20px;border:1px solid var(--border);">
          <span style="display:inline-flex;color:${loanTypeColor(loanType)};">${icon(loanTypeIcon(loanType), 13)}</span> ${loanTypeLabel(loanType)}
        </span>
      ` : ''}
      <button class="btn btn-secondary btn-sm" id="auditBtn" style="flex-shrink:0;font-size:11px;">${icons.audit} Auditoria</button>
    </div>

    <!-- Cliente -->
    <div class="card" style="margin-bottom:12px;padding:12px;">
      <div style="display:flex;align-items:center;gap:10px;">
        ${clientAvatar}
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${loan.clientId?.name || '—'}</div>
          <div style="font-size:11px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${loan.clientId?.email || loan.clientId?.phone || ''}</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="clientInfoBtn" style="flex-shrink:0;font-size:11px;padding:5px 10px;">Ver info</button>
        <span class="${loanStatusClass(loan.status)}" style="flex-shrink:0;font-size:11px;">${loanStatusLabel(loan.status)}</span>
      </div>
    </div>

    <!-- Resumen financiero (solo para FIXED_INTEREST e INSTALLMENTS) -->
    ${financialSummaryHTML}

    <!-- Info préstamo -->
    <div class="card" style="margin-bottom:12px;padding:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);">Informacion</div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-sm" id="addPaymentBtn" style="font-size:10px;padding:6px 10px;background:var(--green-strong);color:#fff;border:none;" ${loan.status === 'PAID' ? 'disabled' : ''}>${icons.plus} Registrar Pago</button>
          <button id="receiptBtn" title="Comprobante" style="width:32px;height:32px;background:none;border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);border-radius:var(--radius-sm);">${icons.download}</button>
          <button id="editLoanBtn" title="Editar" style="width:32px;height:32px;background:none;border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);border-radius:var(--radius-sm);">${icons.edit}</button>
        </div>
      </div>
      ${(loanType === 'NORMAL') ? `
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">
          ${statBlock('Capital', formatCurrency(loan.amount), 'var(--text)')}
          ${statBlock('Interes', formatCurrency(loan.interest), 'var(--yellow)')}
          ${statBlock('Total', formatCurrency(loan.total), 'var(--text)')}
          ${statBlock('Cobrado', formatCurrency(loan.amountPaid), 'var(--green)')}
          ${statBlock('Pendiente', formatCurrency(remaining), remaining > 0 ? 'var(--red)' : 'var(--green)')}
          ${statBlock('Vence', formatDate(loan.dueDate), overdue ? 'var(--red)' : 'var(--text)')}
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text);margin-bottom:4px;">
            <span>Progreso</span><span>${progress}%</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill ${loan.status === 'PAID' ? 'paid' : loan.status === 'PARTIALLY_PAID' ? 'partial' : ''}" style="width:${progress}%;"></div>
          </div>
        </div>

        ${overdue && loan.status !== 'PAID' ? `<div class="alert alert-error" style="margin-top:10px;font-size:11px;padding:8px 12px;">${icons.alert} Vencido desde ${formatDate(loan.dueDate)}</div>` : ''}
      ` : (isFixedInterest ? `
        <div style="padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);font-size:11px;color:var(--text3);line-height:1.5;margin-bottom:4px;">
          Prestamo de interes fijo: el capital no vence, mira el resumen financiero arriba para saldo actual.
        </div>
      ` : `
        <div style="padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);font-size:11px;color:var(--text3);line-height:1.5;margin-bottom:4px;">
          Prestamo a diferidos: todos los detalles están en el resumen financiero arriba.
        </div>
      `)}

      ${loan.description ? `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text);margin-bottom:4px;">Motivo</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.4;">${loan.description}</div>
        </div>` : ''}
    </div>

    <!-- Pagos -->
    <div class="card" style="padding:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text);">Historial de pagos</div>
          <div style="font-size:11px;color:var(--text3);">${payments.length} pagos registrados</div>
        </div>
      </div>
      <div id="paymentsContent"></div>
    </div>
  `;

  renderPayments(container.querySelector('#paymentsContent'), payments, loanType);

  container.querySelector('#backBtn').onclick = () => {
    if (typeof backTarget === 'string' && backTarget.startsWith('client:')) {
      const clientId = backTarget.split(':')[1];
      window.location.hash = `#clients?id=${clientId}`;
    } else {
      window.location.hash = '#loans';
    }
    window.dispatchEvent(new CustomEvent('navigate'));
  };
  
  container.querySelector('#addPaymentBtn')?.addEventListener('click', () => {
    paymentModal(loan, async () => {
      // 👇 Recargar el préstamo y los pagos después de registrar un pago
      const [updatedLoan, updatedPayments] = await Promise.all([
        loanService.getOne(loanId),
        paymentService.listByLoan(loanId),
      ]);
      renderDetail(container, updatedLoan, updatedPayments, loanId, backTarget);
    });
  });
  
  container.querySelector('#editLoanBtn')?.addEventListener('click', async () => {
    const { loanModal } = await import('./Loans.js');
    const allClients = await import('../services/client.service.js').then(m => m.clientService.list());
    loanModal(loan, allClients, async () => {
      const [updatedLoan, updatedPayments] = await Promise.all([
        loanService.getOne(loanId),
        paymentService.listByLoan(loanId),
      ]);
      renderDetail(container, updatedLoan, updatedPayments, loanId, backTarget);
    });
  });
  
  container.querySelector('#receiptBtn').onclick = () => {
    openReceiptExportModal({ loan, payments });
  };

  container.querySelector('#clientInfoBtn').onclick = () => {
    clientInfoModal(loan.clientId);
  };

  container.querySelector('#auditBtn').onclick = async () => {
    try {
      const logs = await loanService.getAuditLogs(loanId);
      auditModal(logs);
    } catch (err) {
      toast.error(err.message);
    }
  };

  container.querySelector('#paymentsContent').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-delete-payment]');
    if (!btn) return;
    confirmDialog('¿Eliminar este pago? El saldo sera revertido.', async () => {
      try {
        await paymentService.delete(btn.dataset.deletePayment);
        toast.success('Pago eliminado');
        // 👇 Recargar el préstamo y los pagos
        const [updatedLoan, updatedPayments] = await Promise.all([
          loanService.getOne(loanId),
          paymentService.listByLoan(loanId),
        ]);
        // 👇 Re-renderizar con los datos actualizados
        renderDetail(container, updatedLoan, updatedPayments, loanId, backTarget);
      } catch (err) {
        toast.error(err.message);
      }
    });
  });
}

// Resumen financiero específico por tipo de préstamo
// Resumen financiero específico por tipo de préstamo
function renderFinancialSummary(loan, loanType, payments = []) {
  if (loanType === 'FIXED_INTEREST') {
    const capitalPendiente = loan.capitalPendiente ?? 0;
    const interesesPendientes = loan.interesesPendientes ?? 0;
    const totalAdeudado = capitalPendiente + interesesPendientes;
    
    // Calcular próxima fecha de interés
    let proximaFecha = null;
    if (loan.ultimaGeneracionIntereses) {
      const fecha = new Date(loan.ultimaGeneracionIntereses);
      fecha.setMonth(fecha.getMonth() + 1);
      proximaFecha = fecha;
    }
  
    return `
      <div class="card" style="margin-bottom:12px;padding:14px;border-left:3px solid ${loanTypeColor(loanType)};">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:7px;">
          <span style="display:inline-flex;color:${loanTypeColor(loanType)};">${icon('clock', 15)}</span>
          Resumen financiero — Interes fijo
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px;">
          ${statBlock('Capital original', formatCurrency(loan.capitalOriginal ?? 0), 'var(--text)')}
          ${statBlock('Capital pendiente', formatCurrency(capitalPendiente), 'var(--text)')}
          ${statBlock('Interes mensual', formatCurrency(loan.interesMensual ?? 0), 'var(--yellow)')}
          ${statBlock('Intereses pendientes', formatCurrency(interesesPendientes), 'var(--yellow)')}
          ${statBlock('Intereses pagados', formatCurrency(loan.interesesPagados ?? 0), 'var(--green)')}
          ${statBlock('Total pagado', formatCurrency(loan.totalPagado ?? 0), 'var(--green)')}
        </div>
        <!-- Próxima fecha de interés -->
        <div style="padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;">Próximo interés</span>
          <span style="font-family:var(--mono);font-size:14px;font-weight:700;color:${proximaFecha ? 'var(--yellow)' : 'var(--text3)'};">${proximaFecha ? formatDate(proximaFecha) : '—'}</span>
        </div>
        <div style="padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;">Total adeudado hoy</span>
          <span style="font-family:var(--mono);font-size:16px;font-weight:800;color:${totalAdeudado > 0 ? 'var(--red)' : 'var(--green)'};">${formatCurrency(totalAdeudado)}</span>
        </div>
      </div>
    `;
  }

  if (loanType === 'INSTALLMENTS') {
    const totalCuotas = loan.meses ?? 0;
    // Opción 1: Calcular cuotas pagadas basado en la cantidad de pagos registrados
    const cuotasPagadas = payments.length;
    // Asegurar que no exceda el total
    const cuotasPagadasFinal = Math.min(cuotasPagadas, totalCuotas);
    const cuotasProgress = totalCuotas > 0 ? Math.round((cuotasPagadasFinal / totalCuotas) * 100) : 0;

    return `
      <div class="card" style="margin-bottom:12px;padding:14px;border-left:3px solid ${loanTypeColor(loanType)};">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:7px;">
          <span style="display:inline-flex;color:${loanTypeColor(loanType)};">${icon('calendar', 15)}</span>
          Resumen financiero — Diferidos
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
          ${statBlock('Capital', formatCurrency(loan.capitalOriginal ?? loan.amount ?? 0), 'var(--text)')}
          ${statBlock('Interes', `${loan.porcentajeInteres ?? 0}% / mes`, 'var(--yellow)')}
          ${statBlock('Meses', String(loan.meses ?? '-'), 'var(--text)')}
          ${statBlock('Cuota mensual', formatCurrency(loan.cuotaMensual ?? 0), 'var(--accent2)')}
          ${statBlock('Ganancia total', formatCurrency(loan.gananciaTotal ?? 0), 'var(--green)')}
          ${statBlock('Total a pagar', formatCurrency(loan.totalAPagar ?? loan.total ?? 0), 'var(--text)')}
        </div>
        
        <!-- Progreso de cuotas -->
        <div style="margin-top:12px;padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text);margin-bottom:6px;">
            <span>Cuotas pagadas</span>
            <span style="font-weight:700;color:var(--accent2);">${cuotasPagadasFinal} / ${totalCuotas}</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill ${cuotasProgress >= 100 ? 'paid' : ''}" style="width:${cuotasProgress}%;background:linear-gradient(90deg,var(--accent),var(--accent2));"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-top:4px;">
            <span>0%</span>
            <span>${cuotasProgress}%</span>
            <span>100%</span>
          </div>
        </div>

        ${loan.fechaPrimerPago && loan.fechaUltimoPago ? `
          <div style="margin-top:8px;padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);display:flex;justify-content:space-between;font-size:11px;color:var(--text2);">
            <span>1er pago: <strong style="color:var(--text);">${formatDate(loan.fechaPrimerPago)}</strong></span>
            <span>Ultimo pago: <strong style="color:var(--text);">${formatDate(loan.fechaUltimoPago)}</strong></span>
          </div>
        ` : ''}
      </div>
    `;
  }

  return '';
}

function clientInfoModal(clientId) {
  const content = document.createElement('div');
  const avatar = clientId?.avatar
    ? `<img src="${clientId.avatar.startsWith('data:') ? clientId.avatar : `data:image/jpeg;base64,${clientId.avatar}`}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;"/>`
    : `<div class="user-avatar" style="width:64px;height:64px;font-size:20px;">${(clientId?.name || '?').slice(0,2).toUpperCase()}</div>`;

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:16px;">
      ${avatar}
      <div style="font-size:16px;font-weight:700;color:var(--text);">${clientId?.name || '—'}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${clientId?.email ? clientInfoRow(icons.mail, 'Correo', clientId.email) : ''}
      ${clientId?.phone ? clientInfoRow(icons.phone, 'Telefono', clientId.phone) : ''}
      ${clientId?.address ? clientInfoRow(icons.location, 'Direccion', clientId.address) : ''}
    </div>
  `;
  createModal({ title: 'Informacion del cliente', content });
}

function clientInfoRow(iconSvg, label, value) {
  return `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:var(--radius-sm);">
      <span style="color:var(--text3);flex-shrink:0;">${iconSvg}</span>
      <div>
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">${label}</div>
        <div style="font-size:13px;color:var(--text);">${value}</div>
      </div>
    </div>
  `;
}

function renderPayments(el, payments, loanType) {
  if (!payments.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${icons.payments}</div>
        <div class="empty-state-title">Sin pagos registrados</div>
        <div class="empty-state-desc">Registra el primer pago para este prestamo</div>
      </div>
    `;
    return;
  }

  const showSplitColumns = loanType === 'FIXED_INTEREST';

  el.innerHTML = `
    <table class="payments-table" style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;padding:0 8px 8px 0;border-bottom:2px solid var(--border);width:24px;">#</th>
          <th style="text-align:left;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;padding:0 8px 8px 0;border-bottom:2px solid var(--border);">Monto</th>
          ${showSplitColumns ? `
            <th style="text-align:center;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;padding:0 8px 8px 0;border-bottom:2px solid var(--border);">A interes</th>
            <th style="text-align:center;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;padding:0 8px 8px 0;border-bottom:2px solid var(--border);">A capital</th>
          ` : ''}
          <th style="text-align:center;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;padding:0 8px 8px 0;border-bottom:2px solid var(--border);">Fecha</th>
          <th style="text-align:center;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;padding:0 0 8px 0;border-bottom:2px solid var(--border);width:36px;">Borrar</th>
        </tr>
      </thead>
      <tbody id="paymentsBody"></tbody>
    </table>
  `;

  const tbody = el.querySelector('#paymentsBody');
  payments.forEach((p, i) => {
    const fecha = formatDate(p.date).replace(/\s\d{4}$/, '');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-size:11px;color:var(--text3);font-family:var(--mono);padding:8px 8px 8px 0;border-bottom:1px solid var(--border);">#${i+1}</td>
      <td style="font-family:var(--mono);font-size:14px;font-weight:700;color:var(--green);padding:8px 8px 8px 0;border-bottom:1px solid var(--border);">${formatCurrency(p.amount)}</td>
      ${showSplitColumns ? `
        <td style="font-family:var(--mono);font-size:12px;font-weight:600;color:var(--yellow);text-align:center;padding:8px 8px 8px 0;border-bottom:1px solid var(--border);">${formatCurrency(p.appliedToInterest ?? 0)}</td>
        <td style="font-family:var(--mono);font-size:12px;font-weight:600;color:var(--text);text-align:center;padding:8px 8px 8px 0;border-bottom:1px solid var(--border);">${formatCurrency(p.appliedToCapital ?? 0)}</td>
      ` : ''}
      <td style="font-size:12px;font-weight:600;color:var(--text);text-align:center;padding:8px 8px 8px 0;border-bottom:1px solid var(--border);">${fecha}</td>
      <td style="text-align:center;padding:8px 0;border-bottom:1px solid var(--border);">
        <button style="width:26px;height:26px;background:var(--red-bg);border:1px solid rgba(255,107,107,0.2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:var(--red);border-radius:var(--radius-sm);" data-delete-payment="${p._id}">${icons.trash}</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function statBlock(label, value, color) {
  return `
    <div style="padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center;">
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text3);margin-bottom:3px;">${label}</div>
      <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:${color};white-space:nowrap;">${value}</div>
    </div>
  `;
}

export function paymentModalStandalone(loan, onSave) {
  paymentModal(loan, onSave);
}

function paymentModal(loan, onSave) {
  const isFixedInterest = (loan.loanType || 'NORMAL') === 'FIXED_INTEREST';
  const isInstallments = (loan.loanType || 'NORMAL') === 'INSTALLMENTS';
  
  // Calcular remaining según tipo
  const remaining = isFixedInterest
    ? (loan.capitalPendiente ?? 0) + (loan.interesesPendientes ?? 0)
    : loan.total - loan.amountPaid;

  // Para INSTALLMENTS, obtener la cuota mensual y calcular cuota actual
  const cuotaMensual = isInstallments ? (loan.cuotaMensual ?? 0) : 0;
  const totalCuotas = isInstallments ? (loan.meses ?? 0) : 0;
  const cuotasPagadas = isInstallments ? Math.floor((loan.amountPaid ?? 0) / cuotaMensual) : 0;
  const cuotasRestantes = Math.max(0, totalCuotas - cuotasPagadas);
  
  // Calcular próxima fecha de pago
  const nextPaymentDate = isInstallments ? calcularProximaFechaPago(loan) : null;

  const content = document.createElement('div');
  content.className = 'form-grid';
  content.style.gap = '16px';

  // Info del préstamo
  const info = document.createElement('div');
  info.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';
  
  if (isFixedInterest) {
    info.innerHTML = `
      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Interes pendiente</div>
        <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--yellow);">${formatCurrency(loan.interesesPendientes ?? 0)}</div>
      </div>
      <div style="padding:14px;background:var(--red-bg);border-radius:var(--radius-sm);border:1px solid rgba(255,107,107,0.2);">
        <div style="font-size:10px;color:var(--red);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Capital pendiente</div>
        <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--red);">${formatCurrency(loan.capitalPendiente ?? 0)}</div>
      </div>
    `;
  } else if (isInstallments) {
    info.innerHTML = `
      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);text-align:center;">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Cuota a pagar</div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--accent2);">${formatCurrency(cuotaMensual)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:4px;">Cuota ${cuotasPagadas + 1} de ${totalCuotas}</div>
      </div>
      <div style="padding:14px;background:${cuotasRestantes > 0 ? 'var(--red-bg)' : 'var(--green-bg)'};border-radius:var(--radius-sm);border:1px solid ${cuotasRestantes > 0 ? 'rgba(255,107,107,0.2)' : 'rgba(34,211,160,0.2)'};text-align:center;">
        <div style="font-size:10px;color:${cuotasRestantes > 0 ? 'var(--red)' : 'var(--green)'};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Cuotas restantes</div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:${cuotasRestantes > 0 ? 'var(--red)' : 'var(--green)'};">${cuotasRestantes}</div>
        ${nextPaymentDate ? `<div style="font-size:10px;color:var(--text3);margin-top:4px;">Próximo vence: ${formatDate(nextPaymentDate)}</div>` : ''}
      </div>
    `;
  } else {
    // NORMAL
    info.innerHTML = `
      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Total</div>
        <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--text);">${formatCurrency(loan.total)}</div>
      </div>
      <div style="padding:14px;background:var(--red-bg);border-radius:var(--radius-sm);border:1px solid rgba(255,107,107,0.2);">
        <div style="font-size:10px;color:var(--red);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Pendiente</div>
        <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--red);">${formatCurrency(remaining)}</div>
      </div>
    `;
  }
  content.appendChild(info);

  if (isFixedInterest) {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:var(--text3);padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm);line-height:1.4;';
    hint.textContent = 'El pago se aplica primero a intereses pendientes; el excedente reduce el capital.';
    content.appendChild(hint);
  }

  if (isInstallments) {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:var(--text3);padding:10px 12px;background:var(--yellow-bg);border-radius:var(--radius-sm);line-height:1.4;border:1px solid rgba(255,209,102,0.3);';
    hint.innerHTML = `
      <strong style="color:var(--yellow);">💡 Pago fijo:</strong> 
      <span style="color:var(--text2);">El monto de la cuota es fijo (${formatCurrency(cuotaMensual)}). 
      ${cuotasRestantes === 0 ? 'Ya completaste todas las cuotas.' : `Restan ${cuotasRestantes} cuota(s).`}</span>
    `;
    content.appendChild(hint);
  }

  // Campo de monto
  const amountField = inputGroup({
    id: 'pAmount',
    label: isInstallments ? 'Monto de la cuota ($)' : 'Monto del pago ($)',
    type: 'number',
    required: true,
    min: FIELD_LIMITS.money.min,
    max: FIELD_LIMITS.money.max,
    step: '0.01',
    placeholder: isInstallments ? formatCurrency(cuotaMensual) : '0.00',
    value: isInstallments ? cuotaMensual : '',
  });

  // Para INSTALLMENTS, deshabilitar el campo (solo lectura)
  if (isInstallments) {
    const input = amountField.querySelector('#pAmount');
    if (input) {
      input.disabled = true;
      input.style.background = 'var(--surface2)';
      input.style.cursor = 'not-allowed';
      input.style.opacity = '0.7';
    }
    // Agregar un input hidden para enviar el valor
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.id = 'pAmountHidden';
    hiddenInput.value = cuotaMensual;
    amountField.appendChild(hiddenInput);
  }

  content.appendChild(amountField);
  content.appendChild(inputGroup({ 
    id: 'pDate', 
    label: 'Fecha del pago', 
    type: 'date', 
    value: nextPaymentDate ? formatDateInput(nextPaymentDate) : new Date().toISOString().split('T')[0] 
  }));

  const footer = document.createElement('div');
  footer.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.style.cssText = 'background:var(--surface2);color:var(--red);border:1.5px solid rgba(255,107,107,0.3);font-weight:600;border-radius:var(--radius-sm);padding:13px;font-size:14px;';
  cancelBtn.textContent = 'Cancelar';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.style.cssText = 'padding:13px;font-size:14px;border-radius:var(--radius-sm);';
  saveBtn.textContent = isInstallments ? `Pagar cuota ${cuotasPagadas + 1}` : 'Registrar pago';
  
  // Deshabilitar si ya no hay cuotas restantes
  if (isInstallments && cuotasRestantes <= 0) {
    saveBtn.disabled = true;
    saveBtn.textContent = '✓ Todas las cuotas pagadas';
    saveBtn.style.background = 'var(--green)';
  }

  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);

  const { close } = createModal({ title: 'Registrar pago', content, footer });
  cancelBtn.onclick = close;

  saveBtn.onclick = async () => {
    clearFieldErrors('pAmount');
    
    // Para INSTALLMENTS, usar el valor del hidden
    const amount = isInstallments 
      ? parseFloat(document.getElementById('pAmountHidden')?.value || cuotaMensual)
      : parseFloat(document.getElementById('pAmount').value);
      
    const date = document.getElementById('pDate').value;
    const amountErr = validateNumberRange(amount, FIELD_LIMITS.money, 'Monto');
    if (amountErr) { showFieldError('pAmount', amountErr); return; }
    
    // Validación específica para INSTALLMENTS
    if (isInstallments) {
      // Verificar que el monto sea exactamente la cuota
      if (Math.abs(amount - cuotaMensual) > 0.01) {
        showFieldError('pAmount', `El pago debe ser exactamente ${formatCurrency(cuotaMensual)}`);
        return;
      }
      // Verificar que no exceda el total adeudado
      if (amount > remaining + 0.01) {
        showFieldError('pAmount', `No puede superar el saldo restante (${formatCurrency(remaining)})`);
        return;
      }
    } else if (!isFixedInterest && amount > remaining + 0.01) {
      showFieldError('pAmount', `No puede superar el saldo (${formatCurrency(remaining)})`);
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner"></span>`;

    try {
      const data = { loanId: loan._id, amount };
      if (date) data.date = date;
      const created = await paymentService.create(data);
      const [updatedLoan, updatedPayments] = await Promise.all([
        loanService.getOne(loan._id),
        paymentService.listByLoan(loan._id),
      ]);
      toast.success(isInstallments ? 'Cuota pagada' : 'Pago registrado');
      close();
      await Promise.resolve(onSave?.());
      openReceiptExportModal({
        loan: updatedLoan,
        payments: updatedPayments,
        paymentId: created?._id || null,
      });
    } catch (err) {
      toast.error(err.message);
      saveBtn.disabled = false;
      saveBtn.textContent = isInstallments ? `Pagar cuota ${cuotasPagadas + 1}` : 'Registrar pago';
    }
  };
}

// Función para calcular la próxima fecha de pago
function calcularProximaFechaPago(loan) {
  if (!loan.fechaPrimerPago) return null;
  const cuotasPagadas = Math.floor((loan.amountPaid ?? 0) / (loan.cuotaMensual ?? 0));
  const fechaBase = new Date(loan.fechaPrimerPago);
  fechaBase.setMonth(fechaBase.getMonth() + cuotasPagadas);
  return fechaBase;
}

function auditModal(logs) {
  const content = document.createElement('div');
  if (!logs.length) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-title">Sin registros</div></div>`;
  } else {
    content.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${logs.map(log => `
          <div style="padding:10px;background:var(--surface2);border-radius:var(--radius-sm);border-left:3px solid var(--accent);">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="font-weight:600;font-size:12px;color:var(--accent2);">${log.action}</span>
              <span style="font-size:11px;color:var(--text3);">${formatDate(log.createdAt)}</span>
            </div>
            <div style="font-size:11px;color:var(--text3);">${log.entityType}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  createModal({ title: 'Auditoria', content });
}