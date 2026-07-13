import { createLayout } from '../components/Layout.js';
import { loanService } from '../services/loan.service.js';
import { clientService } from '../services/client.service.js';
import { createModal, confirmDialog } from '../components/Modal.js';
import { inputGroup, selectGroup, showFieldError, clearFieldErrors } from '../components/FormBuilder.js';
import { icons, icon } from '../components/Icons.js';
import { createLoanCard } from '../components/LoanCard.js';
import { createLoanTypeSelector, buildLoanTypeFields } from '../components/LoanTypeSelector.js';
import { calculateInstallments } from '../utility/loanTypeCalculations.js';
import { toast } from '../components/Toast.js';
import { isOverdue, debounce, formatCurrency, formatDate, loanTypeLabel, loanTypeIcon, loanTypeColor } from '../utility/helpers.js';
import { FIELD_LIMITS, validateNumberRange } from '../utility/validation.js';
import { renderLoanDetail } from './LoanDetail.js';

let allLoans = [];
let allClients = [];
let activeFilter = 'all';
let activeTypeFilter = 'all';
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

export async function renderLoans() {
  document.body.innerHTML = '';
  const container = createLayout('loans', 'Prestamos');
  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  try {
    [allLoans, allClients] = await Promise.all([loanService.list(), clientService.list()]);
    renderLoansList(container);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} ${err.message}</div>`;
  }
}

function renderLoansList(container) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
      <div>
        <h1 class="page-title">Prestamos</h1>
        <p class="page-subtitle">${allLoans.length} prestamos registrados</p>
      </div>
      <button class="btn btn-primary btn-sm" id="newLoanBtn" style="flex-shrink:0;">${icons.plus} Nuevo Prestamo</button>
    </div>

    <div style="display:flex;gap:6px;flex-wrap:nowrap;margin-bottom:12px;align-items:center;overflow-x:auto;padding-bottom:4px;">
      ${[
        { key: 'all', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
        { key: 'PARTIALLY_PAID', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v10l4 2"/><circle cx="12" cy="12" r="10"/></svg>` },
        { key: 'PENDING', label: 'Pendiente' },
        { key: 'PAID', label: 'Pagado' },
        { key: 'overdue', label: 'Vencidos' },
      ].map(f => `
        <button data-filter="${f.key}" style="
          padding:6px 12px;
          border-radius:20px;
          font-size:12px;
          font-weight:600;
          border:1.5px solid var(--border);
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

    <div style="display:flex;gap:6px;flex-wrap:nowrap;margin-bottom:16px;align-items:center;overflow-x:auto;padding-bottom:4px;">
      ${[
        { key: 'all', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
        { key: 'NORMAL', label: 'Normal' },
        { key: 'FIXED_INTEREST', label: 'Interés fijo' },
        { key: 'INSTALLMENTS', label: 'Diferidos' },
      ].map(f => `
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

    <div class="search-bar" style="margin-bottom:20px;max-width:100%;">
      ${icons.search}
      <input type="text" placeholder="Buscar cliente..." id="loanSearch" maxlength="${FIELD_LIMITS.search.max}"/>
    </div>

    <div id="loansGrid"></div>
    <div id="pagination" style="display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap;"></div>
    <div id="emptyLoans" class="empty-state" style="display:none;">
      <div class="empty-state-icon">${icons.loans}</div>
      <div class="empty-state-title">Sin prestamos</div>
      <div class="empty-state-desc">Crea el primer prestamo para un cliente</div>
      <button class="btn btn-primary" id="emptyNewBtn">${icons.plus} Nuevo prestamo</button>
    </div>
  `;

  const grid = container.querySelector('#loansGrid');
  const emptyEl = container.querySelector('#emptyLoans');
  const paginationEl = container.querySelector('#pagination');

  const emptyMessages = {
    all: { title: 'Sin prestamos', desc: 'Crea el primer prestamo para un cliente' },
    PENDING: { title: 'Sin prestamos pendientes', desc: 'No tienes prestamos pendientes de cobro' },
    PARTIALLY_PAID: { title: 'Sin prestamos parciales', desc: 'No tienes prestamos pagados parcialmente' },
    PAID: { title: 'Sin prestamos pagados', desc: 'Aun no tienes prestamos completados' },
    overdue: { title: 'Sin prestamos vencidos', desc: 'Todo al dia, no tienes prestamos vencidos' },
  };

  const refresh = async () => {
    allLoans = await loanService.list();
    renderLoansList(container);
  };

  const openModal = (loan = null) => loanModal(loan, allClients, refresh);

  function getFiltered(query = '') {
    let data = [...allLoans];
    if (activeFilter === 'overdue') data = data.filter(l => isOverdue(l.dueDate, l.status));
    else if (activeFilter !== 'all') data = data.filter(l => l.status === activeFilter);
    if (activeTypeFilter !== 'all') data = data.filter(l => (l.loanType || 'NORMAL') === activeTypeFilter);
    if (query) data = data.filter(l => (l.clientId?.name || '').toLowerCase().includes(query.toLowerCase()));
    return data.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  function renderGrid(data) {
    grid.innerHTML = '';

    if (!data.length) {
      const msg = emptyMessages[activeFilter] || emptyMessages.all;
      emptyEl.style.display = 'block';
      emptyEl.innerHTML = `
        <div class="empty-state-icon">${icons.loans}</div>
        <div class="empty-state-title">${msg.title}</div>
        <div class="empty-state-desc">${msg.desc}</div>
        ${activeFilter === 'all' ? `<button class="btn btn-primary" id="emptyNewBtn">${icons.plus} Nuevo prestamo</button>` : ''}
      `;
      if (activeFilter === 'all') {
        emptyEl.querySelector('#emptyNewBtn')?.addEventListener('click', () => openModal());
      }
      paginationEl.innerHTML = '';
      return;
    }

    emptyEl.style.display = 'none';

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, data.length);
    const pageData = data.slice(start, end);

    pageData.forEach((loan) => {
      const card = createLoanCard(loan, {
        showClient: true,
        onRegisterPay: loan.status === 'PAID'
          ? null
          : async () => {
              const { paymentModalStandalone } = await import('./LoanDetail.js');
              paymentModalStandalone(loan, refresh);
            },
        onViewDetail: () => renderLoanDetail(loan._id),
        onEdit: () => openModal(loan),
        onDelete: () => {
          confirmDialog(`¿Eliminar el prestamo de <strong>${loan.clientId?.name || 'este cliente'}</strong>?`, async () => {
            try {
              await loanService.delete(loan._id);
              toast.success('Prestamo eliminado');
              await refresh();
            } catch (err) {
              toast.error(err.message);
            }
          });
        },
      });
      grid.appendChild(card);
    });

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
          renderGrid(getFiltered(search.value));
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
          renderGrid(getFiltered(search.value));
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
          renderGrid(getFiltered(search.value));
        }
      };
      paginationEl.appendChild(nextBtn);
    }
  }

  const search = container.querySelector('#loanSearch');
  search.oninput = debounce(() => {
    currentPage = 1;
    renderGrid(getFiltered(search.value));
  }, 250);

  container.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.onclick = () => {
      activeFilter = btn.dataset.filter;
      currentPage = 1;
      renderLoansList(container);
    };
  });

  container.querySelectorAll('[data-type-filter]').forEach((btn) => {
    btn.onclick = () => {
      activeTypeFilter = btn.dataset.typeFilter;
      currentPage = 1;
      renderLoansList(container);
    };
  });

  container.querySelector('#newLoanBtn').onclick = () => openModal();
  container.querySelector('#emptyNewBtn')?.addEventListener('click', () => openModal());

  renderGrid(getFiltered());
}

// ============================================================
// loanModal — SIN CAMBIOS, exactamente como estaba
// ============================================================
export function loanModal(loan, clients, onSave) {
  const isEdit = !!loan;
  let selectedType = isEdit ? (loan.loanType || 'NORMAL') : 'NORMAL';

  const content = document.createElement('div');
  content.className = 'form-grid';
  content.style.gap = '16px';

  if (!isEdit) {
    const clientOpts = clients.map(c => ({ value: c._id, label: c.name }));
    content.appendChild(selectGroup({ id: 'lClientId', label: 'Cliente', required: true, options: clientOpts }));
  } else {
    const info = document.createElement('div');
    info.style.cssText = 'padding:12px;background:var(--surface2);border-radius:var(--radius-sm);font-size:14px;color:var(--text2);';
    info.innerHTML = `
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Cliente</div>
      <div style="font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${loan.clientId?.name || '-'}</div>
    `;
    content.appendChild(info);
  }

  if (!isEdit) {
    const typeSelectorEl = createLoanTypeSelector({
      initialType: selectedType,
      onChange: (type) => {
        selectedType = type;
        rebuildDynamicFields();
      },
    });
    content.appendChild(typeSelectorEl);
  } else {
    const typeBadge = document.createElement('div');
    typeBadge.style.cssText = 'font-size:11px;color:var(--text3);margin-bottom:-4px;';
    const emojiMap = { NORMAL: '🟢', FIXED_INTEREST: '🟡', INSTALLMENTS: '🔵' };
    const labelMap = { NORMAL: 'Normal', FIXED_INTEREST: 'Interés fijo', INSTALLMENTS: 'Diferidos' };
    typeBadge.innerHTML = `Tipo de préstamo: <strong style="color:var(--text2);">${emojiMap[selectedType] || '🟢'} ${labelMap[selectedType] || 'Normal'}</strong> (no editable)`;
    content.appendChild(typeBadge);
  }

  const dynamicFieldsWrap = document.createElement('div');
  dynamicFieldsWrap.id = 'dynamicLoanFields';
  content.appendChild(dynamicFieldsWrap);

  function currentFieldValues() {
    if (isEdit) {
      return {
        amount: loan.amount,
        interest: loan.interest,
        dueDate: loan.dueDate ? new Date(loan.dueDate).toISOString().split('T')[0] : '',
        paymentDate: loan.paymentDate ? new Date(loan.paymentDate).toISOString().split('T')[0] : '',
        capitalOriginal: loan.capitalOriginal,
        interesMensual: loan.interesMensual,
        porcentajeInteres: loan.porcentajeInteres,
        meses: loan.meses,
        fechaInicio: loan.fechaInicio ? new Date(loan.fechaInicio).toISOString().split('T')[0] : '',
      };
    }
    return {
      amount: document.getElementById('lAmount')?.value,
      interest: document.getElementById('lInterest')?.value,
      dueDate: document.getElementById('lDueDate')?.value,
      paymentDate: document.getElementById('lPayDate')?.value,
      capitalOriginal: document.getElementById('lCapitalOriginal')?.value,
      interesMensual: document.getElementById('lInteresMensual')?.value,
      porcentajeInteres: document.getElementById('lPorcentajeInteres')?.value,
      meses: document.getElementById('lMeses')?.value,
      fechaInicio: document.getElementById('lFechaInicio')?.value,
    };
  }

  function rebuildDynamicFields() {
    dynamicFieldsWrap.innerHTML = '';
    dynamicFieldsWrap.appendChild(buildLoanTypeFields(selectedType, currentFieldValues()));

    const descGroup = document.createElement('div');
    descGroup.className = 'input-group';
    descGroup.innerHTML = `
      <label class="input-label" for="lDesc">Descripcion</label>
      <textarea id="lDesc" class="input-field" rows="3" placeholder="Opcional (max. 300 caracteres)" maxlength="300" style="resize:vertical;">${loan?.description || ''}</textarea>
    `;
    dynamicFieldsWrap.appendChild(descGroup);

    if (selectedType === 'INSTALLMENTS') {
      bindInstallmentsPreview();
    }
  }

  function bindInstallmentsPreview() {
    const previewBox = dynamicFieldsWrap.querySelector('#installmentsPreview');
    const capitalInput = dynamicFieldsWrap.querySelector('#lCapitalOriginal');
    const percentInput = dynamicFieldsWrap.querySelector('#lPorcentajeInteres');
    const mesesInput = dynamicFieldsWrap.querySelector('#lMeses');
    const fechaInput = dynamicFieldsWrap.querySelector('#lFechaInicio');
    if (!previewBox || !capitalInput || !percentInput || !mesesInput) return;

    function updatePreview() {
      const capital = parseFloat(capitalInput.value);
      const porcentaje = parseInt(percentInput.value, 10);
      const meses = parseInt(mesesInput.value, 10);
      const fechaInicio = fechaInput?.value || new Date().toISOString().split('T')[0];

      const calc = calculateInstallments({ capital, porcentajeInteres: porcentaje, meses, fechaInicio });

      if (!calc) {
        previewBox.innerHTML = 'Completa capital, % y meses para ver el cálculo';
        return;
      }

      previewBox.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
          <div><span style="color:var(--text3);">Interés total:</span> <strong style="color:var(--yellow);">${formatCurrency(calc.interesTotal)}</strong></div>
          <div><span style="color:var(--text3);">Total a pagar:</span> <strong style="color:var(--text);">${formatCurrency(calc.totalAPagar)}</strong></div>
          <div><span style="color:var(--text3);">Cuota mensual:</span> <strong style="color:var(--accent2);">${formatCurrency(calc.cuotaMensual)}</strong></div>
          <div><span style="color:var(--text3);">Ganancia mensual:</span> <strong style="color:var(--green);">${formatCurrency(calc.gananciaMensual)}</strong></div>
          <div><span style="color:var(--text3);">1er pago:</span> <strong style="color:var(--text2);">${formatDate(calc.fechaPrimerPago)}</strong></div>
          <div><span style="color:var(--text3);">Ultimo pago:</span> <strong style="color:var(--text2);">${formatDate(calc.fechaUltimoPago)}</strong></div>
        </div>
      `;
    }

    [capitalInput, percentInput, mesesInput, fechaInput].forEach((el) => {
      el?.addEventListener('input', updatePreview);
    });
    updatePreview();
  }

  rebuildDynamicFields();

  const footer = document.createElement('div');
  footer.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.style.cssText = 'background:var(--surface2);color:var(--red);border:1.5px solid rgba(255,107,107,0.3);font-weight:600;border-radius:var(--radius-sm);padding:13px;font-size:14px;';
  cancelBtn.textContent = 'Cancelar';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.style.cssText = 'padding:13px;font-size:14px;border-radius:var(--radius-sm);';
  saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear prestamo';

  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);

  const { close } = createModal({ title: isEdit ? 'Editar prestamo' : 'Nuevo prestamo', content, footer });
  cancelBtn.onclick = close;

  saveBtn.onclick = async () => {
    clearFieldErrors('lClientId', 'lAmount', 'lInterest', 'lDueDate', 'lDesc', 'lCapitalOriginal', 'lInteresMensual', 'lPorcentajeInteres', 'lMeses');

    const description = document.getElementById('lDesc')?.value.trim() || '';
    if (description.length > 300) {
      showFieldError('lDesc', 'Maximo 300 caracteres');
      return;
    }

    if (selectedType === 'NORMAL') {
      const amount = parseFloat(document.getElementById('lAmount').value);
      const interest = parseFloat(document.getElementById('lInterest').value);
      const dueDate = document.getElementById('lDueDate').value;
      const paymentDate = document.getElementById('lPayDate').value;
      let valid = true;

      if (!isEdit && !document.getElementById('lClientId')?.value) {
        showFieldError('lClientId', 'Selecciona un cliente');
        valid = false;
      }
      const amountErr = validateNumberRange(amount, FIELD_LIMITS.money, 'Capital');
      if (amountErr) { showFieldError('lAmount', amountErr); valid = false; }
      const interestErr = validateNumberRange(interest, FIELD_LIMITS.interest, 'Interes');
      if (interestErr) { showFieldError('lInterest', interestErr); valid = false; }
      if (!dueDate) { showFieldError('lDueDate', 'La fecha de vencimiento es requerida'); valid = false; }
      if (!valid) return;

      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="spinner"></span>`;

      try {
        const data = { amount, interest, dueDate };
        if (!isEdit) {
          data.clientId = document.getElementById('lClientId').value;
          data.loanType = 'NORMAL';
        }
        if (paymentDate) data.paymentDate = paymentDate;
        if (description) data.description = description;

        if (isEdit) {
          await loanService.update(loan._id, data);
          toast.success('Prestamo actualizado');
        } else {
          await loanService.create(data);
          toast.success('Prestamo creado');
        }

        close();
        onSave();
      } catch (err) {
        toast.error(err.message);
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear prestamo';
      }
      return;
    }

    if (selectedType === 'FIXED_INTEREST') {
      const capitalOriginal = parseFloat(document.getElementById('lCapitalOriginal').value);
      const interesMensual = parseFloat(document.getElementById('lInteresMensual').value);
      const fechaInicio = document.getElementById('lFechaInicio').value;
      let valid = true;

      let clientId = null;
      if (!isEdit) {
        clientId = document.getElementById('lClientId')?.value;
        if (!clientId) { showFieldError('lClientId', 'Selecciona un cliente'); valid = false; }
      }
      const capErr = validateNumberRange(capitalOriginal, FIELD_LIMITS.money, 'Capital');
      if (capErr) { showFieldError('lCapitalOriginal', capErr); valid = false; }
      if (Number.isNaN(interesMensual) || interesMensual <= 0) {
        showFieldError('lInteresMensual', 'El interés mensual debe ser mayor a 0');
        valid = false;
      }
      if (!valid) return;

      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="spinner"></span>`;

      try {
        if (isEdit) {
          await loanService.update(loan._id, {
            capitalOriginal,
            interesMensual,
            fechaInicio: fechaInicio || undefined,
            description: description || undefined,
          });
          toast.success('Prestamo actualizado');
        } else {
          await loanService.create({
            loanType: 'FIXED_INTEREST',
            clientId,
            capitalOriginal,
            interesMensual,
            fechaInicio: fechaInicio || undefined,
            description: description || undefined,
          });
          toast.success('Prestamo creado');
        }
        close();
        onSave();
      } catch (err) {
        toast.error(err.message);
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear prestamo';
      }
      return;
    }

    if (selectedType === 'INSTALLMENTS') {
      const capitalOriginal = parseFloat(document.getElementById('lCapitalOriginal').value);
      const porcentajeInteres = parseInt(document.getElementById('lPorcentajeInteres').value, 10);
      const meses = parseInt(document.getElementById('lMeses').value, 10);
      const fechaInicio = document.getElementById('lFechaInicio').value;
      let valid = true;

      let clientId = null;
      if (!isEdit) {
        clientId = document.getElementById('lClientId')?.value;
        if (!clientId) { showFieldError('lClientId', 'Selecciona un cliente'); valid = false; }
      }
      const capErr = validateNumberRange(capitalOriginal, FIELD_LIMITS.money, 'Capital');
      if (capErr) { showFieldError('lCapitalOriginal', capErr); valid = false; }
      if (!Number.isInteger(porcentajeInteres) || porcentajeInteres < 1 || porcentajeInteres > 20) {
        showFieldError('lPorcentajeInteres', 'El interés debe ser un entero entre 1 y 20');
        valid = false;
      }
      if (!Number.isInteger(meses) || meses < 1 || meses > 12) {
        showFieldError('lMeses', 'El plazo debe ser un entero entre 1 y 12');
        valid = false;
      }
      if (!valid) return;

      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="spinner"></span>`;

      try {
        if (isEdit) {
          await loanService.update(loan._id, {
            capitalOriginal,
            porcentajeInteres,
            meses,
            fechaInicio: fechaInicio || undefined,
            description: description || undefined,
          });
          toast.success('Prestamo actualizado');
        } else {
          await loanService.create({
            loanType: 'INSTALLMENTS',
            clientId,
            capitalOriginal,
            porcentajeInteres,
            meses,
            fechaInicio: fechaInicio || undefined,
            description: description || undefined,
          });
          toast.success('Prestamo creado');
        }
        close();
        onSave();
      } catch (err) {
        toast.error(err.message);
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear prestamo';
      }
      return;
    }
  };
}