import { createLayout } from '../components/Layout.js';
import { loanService } from '../services/loan.service.js';
import { paymentService } from '../services/payment.service.js';
import { createModal, confirmDialog } from '../components/Modal.js';
import { inputGroup, showFieldError, clearFieldErrors } from '../components/FormBuilder.js';
import { icons } from '../components/Icons.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, loanStatusClass, loanStatusLabel, calcProgress, isOverdue } from '../utility/helpers.js';

export async function renderLoanDetail(loanId) {
  document.body.innerHTML = '';
  const container = createLayout('loans', 'Detalle de prestamo');
  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  try {
    const [loan, payments] = await Promise.all([
      loanService.getOne(loanId),
      paymentService.listByLoan(loanId),
    ]);
    renderDetail(container, loan, payments, loanId);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} ${err.message}</div>`;
  }
}

function renderDetail(container, loan, payments, loanId) {
  const progress = calcProgress(loan.amountPaid, loan.total);
  const overdue = isOverdue(loan.dueDate, loan.status);
  const remaining = loan.total - loan.amountPaid;

  const clientAvatar = loan.clientId?.avatar
    ? `<img src="${loan.clientId.avatar.startsWith('data:') ? loan.clientId.avatar : `data:image/jpeg;base64,${loan.clientId.avatar}`}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
    : `<div class="user-avatar" style="width:32px;height:32px;font-size:12px;flex-shrink:0;">${(loan.clientId?.name || '?').slice(0,2).toUpperCase()}</div>`;

    container.innerHTML = `
    <!-- Header compacto -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
      <button class="btn btn-ghost btn-icon" id="backBtn" style="flex-shrink:0;">${icons.arrowLeft}</button>
      <div style="flex:1;min-width:0;">
        <h1 style="font-size:16px;font-weight:700;color:var(--text);line-height:1.2;">Detalle de prestamo</h1>
        <p style="font-size:11px;color:var(--text3);">Historial y pagos</p>
      </div>
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

    <!-- Info préstamo -->
    <div class="card" style="margin-bottom:12px;padding:14px;">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);">Informacion del prestamo</div>
<div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-primary btn-sm" id="addPaymentBtn" style="font-size:10px;padding:6px 10px;" ${loan.status === 'PAID' ? 'disabled' : ''}>${icons.plus} Registrar Pago</button>
          <button id="editLoanBtn" title="Editar" style="width:32px;height:32px;background:none;border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);border-radius:var(--radius-sm);">${icons.edit}</button>
        </div>      </div>

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
${loan.description ? `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text);margin-bottom:4px;">Motivo</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.4;">${loan.description}</div>
        </div>` : ''}    </div>

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

  renderPayments(container.querySelector('#paymentsContent'), payments);

  container.querySelector('#backBtn').onclick = () => {
    window.location.hash = '#loans';
    window.dispatchEvent(new CustomEvent('navigate'));
  };
  container.querySelector('#addPaymentBtn')?.addEventListener('click', () => {
    paymentModal(loan, async () => {
      const [updatedLoan, updatedPayments] = await Promise.all([
        loanService.getOne(loanId),
        paymentService.listByLoan(loanId),
      ]);
      renderDetail(container, updatedLoan, updatedPayments, loanId);
    });
  });
  container.querySelector('#editLoanBtn').onclick = async () => {
    const { loanModal } = await import('./Loans.js');
    const allClients = await import('../services/client.service.js').then(m => m.clientService.list());
    loanModal(loan, allClients, async () => {
      const [updatedLoan, updatedPayments] = await Promise.all([
        loanService.getOne(loanId),
        paymentService.listByLoan(loanId),
      ]);
      renderDetail(container, updatedLoan, updatedPayments, loanId);
    });
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
        const [updatedLoan, updatedPayments] = await Promise.all([
          loanService.getOne(loanId),
          paymentService.listByLoan(loanId),
        ]);
        renderDetail(container, updatedLoan, updatedPayments, loanId);
      } catch (err) {
        toast.error(err.message);
      }
    });
  });
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

function renderPayments(el, payments) {
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

  el.innerHTML = `
    <table class="payments-table" style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;padding:0 8px 8px 0;border-bottom:2px solid var(--border);width:24px;">#</th>
          <th style="text-align:left;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;padding:0 8px 8px 0;border-bottom:2px solid var(--border);">Monto</th>
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
  const remaining = loan.total - loan.amountPaid;
  const content = document.createElement('div');
  content.className = 'form-grid';
  content.style.gap = '16px';

  const info = document.createElement('div');
  info.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';
  info.innerHTML = `
    <div style="padding:14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);">
<div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Total</div>      <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--text);">${formatCurrency(loan.total)}</div>
    </div>
    <div style="padding:14px;background:var(--red-bg);border-radius:var(--radius-sm);border:1px solid rgba(255,107,107,0.2);">
<div style="font-size:10px;color:var(--red);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Pendiente</div>      <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--red);">${formatCurrency(remaining)}</div>
    </div>
  `;
  content.appendChild(info);
  content.appendChild(inputGroup({ id: 'pAmount', label: 'Monto del pago ($)', type: 'number', required: true, min: 0.01, step: '0.01', placeholder: '0.00' }));
  content.appendChild(inputGroup({ id: 'pDate', label: 'Fecha del pago', type: 'date', value: new Date().toISOString().split('T')[0] }));

  const footer = document.createElement('div');
  footer.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.style.cssText = 'background:var(--surface2);color:var(--red);border:1.5px solid rgba(255,107,107,0.3);font-weight:600;border-radius:var(--radius-sm);padding:13px;font-size:14px;';
  cancelBtn.textContent = 'Cancelar';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.style.cssText = 'padding:13px;font-size:14px;border-radius:var(--radius-sm);';
  saveBtn.textContent = 'Registrar pago';
  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);

  const { close } = createModal({ title: 'Registrar pago', content, footer });
  cancelBtn.onclick = close;

  saveBtn.onclick = async () => {
    clearFieldErrors('pAmount');
    const amount = parseFloat(document.getElementById('pAmount').value);
    const date = document.getElementById('pDate').value;
    if (isNaN(amount) || amount <= 0) { showFieldError('pAmount', 'Ingresa un monto valido'); return; }
    if (amount > remaining + 0.01) { showFieldError('pAmount', `No puede superar el saldo (${formatCurrency(remaining)})`); return; }

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner"></span>`;

    try {
      const data = { loanId: loan._id, amount };
      if (date) data.date = date;
      await paymentService.create(data);
      toast.success('Pago registrado');
      close();
      onSave();
    } catch (err) {
      toast.error(err.message);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Registrar pago';
    }
  };
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