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
    let [loan, payments] = await Promise.all([
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

  container.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="btn btn-ghost btn-icon" id="backBtn" title="Volver">${icons.arrowLeft}</button>
        <div>
          <h1 class="page-title">Prestamo — ${loan.clientId?.name || 'Cliente'}</h1>
          <p class="page-subtitle">Detalle y historial de pagos</p>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary" id="auditBtn">${icons.audit} Auditoria</button>
        <button class="btn btn-primary" id="addPaymentBtn" ${loan.status === 'PAID' ? 'disabled' : ''}>${icons.plus} Registrar pago</button>
      </div>
    </div>

    <div class="content-grid content-grid-2" style="margin-bottom:24px;">
      <div class="card">
        <div class="card-header">
          <div class="card-title">Informacion del prestamo</div>
          <span class="${loanStatusClass(loan.status)}">${loanStatusLabel(loan.status)}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
          ${statBlock('Capital', formatCurrency(loan.amount), 'var(--text)')}
          ${statBlock('Interes', formatCurrency(loan.interest), 'var(--yellow)')}
          ${statBlock('Total a pagar', formatCurrency(loan.total), 'var(--text)')}
          ${statBlock('Total cobrado', formatCurrency(loan.amountPaid), 'var(--green)')}
          ${statBlock('Saldo pendiente', formatCurrency(remaining), remaining > 0 ? 'var(--red)' : 'var(--green)')}
          ${statBlock('Fecha vencimiento', formatDate(loan.dueDate), overdue ? 'var(--red)' : 'var(--text)')}
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text3);margin-bottom:8px;">
            <span>Progreso de pago</span><span style="font-family:var(--mono);font-weight:600;">${progress}%</span>
          </div>
          <div class="progress-bar-wrap" style="height:10px;">
            <div class="progress-bar-fill ${loan.status === 'PAID' ? 'paid' : loan.status === 'PARTIALLY_PAID' ? 'partial' : ''}" style="width:${progress}%;"></div>
          </div>
        </div>

        ${loan.description ? `
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);">
            <div style="font-size:12px;color:var(--text3);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.06em;">Descripcion</div>
            <div style="font-size:14px;color:var(--text2);">${loan.description}</div>
          </div>
        ` : ''}

        ${overdue && loan.status !== 'PAID' ? `
          <div class="alert alert-error" style="margin-top:16px;">
            ${icons.alert} Este prestamo esta vencido desde ${formatDate(loan.dueDate)}
          </div>
        ` : ''}
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Informacion del cliente</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;padding-bottom:16px;border-bottom:1px solid var(--border);">
${loan.clientId?.avatar 
  ? `<img src="${loan.clientId.avatar.startsWith('data:') ? loan.clientId.avatar : `data:image/jpeg;base64,${loan.clientId.avatar}`}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
  : `<div class="user-avatar" style="width:48px;height:48px;font-size:16px;">${(loan.clientId?.name || '?').slice(0,2).toUpperCase()}</div>`
}            <div>
              <div style="font-size:17px;font-weight:700;color:var(--text);">${loan.clientId?.name || '—'}</div>
            </div>
          </div>
          ${clientInfo(icons.mail, 'Correo', loan.clientId?.email)}
          ${clientInfo(icons.phone, 'Telefono', loan.clientId?.phone)}
          ${clientInfo(icons.location, 'Direccion', loan.clientId?.address)}
          ${clientInfo(icons.calendar, 'Creado', formatDate(loan.createdAt))}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Historial de pagos</div>
          <div class="card-subtitle">${payments.length} pagos registrados</div>
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

  container.querySelector('#addPaymentBtn').onclick = () => {
    paymentModal(loan, async () => {
      const [updatedLoan, updatedPayments] = await Promise.all([
        loanService.getOne(loanId),
        paymentService.listByLoan(loanId),
      ]);
      renderDetail(container, updatedLoan, updatedPayments, loanId);
    });
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
    const paymentId = btn.dataset.deletePayment;
    confirmDialog('¿Eliminar este pago? El saldo del prestamo sera revertido.', async () => {
      try {
        await paymentService.delete(paymentId);
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
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Monto</th>
            <th>Fecha de pago</th>
            <th>Registrado</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="paymentsBody"></tbody>
      </table>
    </div>
  `;

  const tbody = el.querySelector('#paymentsBody');
  payments.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-mono" style="color:var(--text3);">#${i + 1}</td>
      <td class="td-mono td-primary" style="color:var(--green);font-size:15px;">${formatCurrency(p.amount)}</td>
      <td>${formatDate(p.date)}</td>
      <td style="color:var(--text3);font-size:13px;">${formatDate(p.createdAt)}</td>
      <td>
        <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--red);" data-delete-payment="${p._id}" title="Eliminar pago">${icons.trash}</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function statBlock(label, value, color) {
  return `
    <div style="padding:12px;background:var(--surface2);border-radius:var(--radius-sm);">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text3);margin-bottom:4px;">${label}</div>
      <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:${color};">${value}</div>
    </div>
  `;
}

function clientInfo(iconSvg, label, value) {
  if (!value) return '';
  return `
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="color:var(--text3);flex-shrink:0;">${iconSvg}</span>
      <div>
        <div style="font-size:11px;color:var(--text3);">${label}</div>
        <div style="font-size:14px;color:var(--text2);">${value}</div>
      </div>
    </div>
  `;
}

function paymentModal(loan, onSave) {
  const remaining = loan.total - loan.amountPaid;
  const content = document.createElement('div');
  content.className = 'form-grid';
  content.style.gap = '16px';

  const info = document.createElement('div');
  info.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px;background:var(--surface2);border-radius:var(--radius-sm);';
  info.innerHTML = `
    <div><div style="font-size:11px;color:var(--text3);margin-bottom:2px;">Total prestamo</div><div style="font-family:var(--mono);font-weight:700;">${formatCurrency(loan.total)}</div></div>
    <div><div style="font-size:11px;color:var(--text3);margin-bottom:2px;">Saldo pendiente</div><div style="font-family:var(--mono);font-weight:700;color:var(--red);">${formatCurrency(remaining)}</div></div>
  `;
  content.appendChild(info);
  content.appendChild(inputGroup({ id: 'pAmount', label: 'Monto del pago ($)', type: 'number', required: true, min: 0.01, step: '0.01', placeholder: '0.00' }));
  content.appendChild(inputGroup({ id: 'pDate', label: 'Fecha del pago', type: 'date', value: new Date().toISOString().split('T')[0] }));

  const footer = document.createElement('div');
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancelar';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
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
    if (amount > remaining + 0.01) { showFieldError('pAmount', `El monto no puede superar el saldo pendiente (${formatCurrency(remaining)})`); return; }

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
    content.innerHTML = `<div class="empty-state"><div class="empty-state-title">Sin registros de auditoria</div></div>`;
  } else {
    content.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${logs.map(log => `
          <div style="padding:12px;background:var(--surface2);border-radius:var(--radius-sm);border-left:3px solid var(--accent);">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="font-weight:600;font-size:13px;color:var(--accent2);">${log.action}</span>
              <span style="font-size:12px;color:var(--text3);">${formatDate(log.createdAt)}</span>
            </div>
            <div style="font-size:12px;color:var(--text3);">Entidad: ${log.entityType}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  createModal({ title: 'Auditoria del prestamo', content });
}
