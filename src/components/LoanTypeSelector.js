import { inputGroup } from './FormBuilder.js';
import { icon } from './Icons.js';

/**
 * LoanTypeSelector — tarjetas seleccionables para elegir el tipo de préstamo
 * al crear uno nuevo. NO se usa en edición (el tipo no cambia después de creado).
 *
 * @param {object} opts
 * @param {string} opts.initialType - 'NORMAL' | 'FIXED_INTEREST' | 'INSTALLMENTS'
 * @param {Function} opts.onChange - (type: string) => void, llamado al cambiar selección
 * @returns {HTMLElement}
 */
export function createLoanTypeSelector({ initialType = 'NORMAL', onChange } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'loan-type-selector';
  wrap.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;';

  const TYPES = [
    {
      key: 'NORMAL',
      iconName: 'money',
      title: 'Normal',
      desc: 'Capital + interés fijo, con vencimiento',
      color: 'var(--green)',
      bg: 'var(--green-bg)',
    },
    {
      key: 'FIXED_INTEREST',
      iconName: 'clock',
      title: 'Interés fijo',
      desc: 'Interés mensual renovable, capital constante',
      color: 'var(--yellow)',
      bg: 'var(--yellow-bg)',
    },
    {
      key: 'INSTALLMENTS',
      iconName: 'calendar',
      title: 'Diferidos',
      desc: 'Cuotas mensuales, interés simple',
      color: 'var(--accent2)',
      bg: 'var(--accent-glow)',
    },
  ];

  let current = initialType;

  function paint() {
    wrap.querySelectorAll('[data-loan-type-card]').forEach((card) => {
      const type = card.dataset.loanTypeCard;
      const isActive = type === current;
      const t = TYPES.find((x) => x.key === type);
      card.style.borderColor = isActive ? t.color : 'var(--border)';
      card.style.background = isActive ? t.bg : 'var(--surface2)';
      card.style.transform = isActive ? 'translateY(-1px)' : 'none';
      card.style.boxShadow = isActive ? `0 4px 16px ${t.color}33` : 'none';
    });
  }

  wrap.innerHTML = TYPES.map((t) => `
    <button type="button" data-loan-type-card="${t.key}" style="
      display:flex;
      flex-direction:column;
      align-items:center;
      text-align:center;
      gap:4px;
      padding:12px 8px;
      border-radius:var(--radius-sm);
      border:1.5px solid var(--border);
      background:var(--surface2);
      cursor:pointer;
      transition:all 200ms;
      font-family:var(--font);
    ">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:${t.color}22;color:${t.color};">${icon(t.iconName, 16)}</span>
      <span style="font-size:12px;font-weight:700;color:var(--text);">${t.title}</span>
      <span style="font-size:9px;color:var(--text3);line-height:1.3;">${t.desc}</span>
    </button>
  `).join('');

  wrap.querySelectorAll('[data-loan-type-card]').forEach((card) => {
    card.onclick = () => {
      current = card.dataset.loanTypeCard;
      paint();
      onChange?.(current);
    };
  });

  paint();

  return wrap;
}

/**
 * Construye los campos de formulario específicos según el tipo elegido.
 * Devuelve un HTMLElement (contenedor) que se puede insertar/reemplazar
 * dentro del modal cada vez que cambia el tipo.
 *
 * @param {string} loanType
 * @param {object} values - valores previos a preservar si el usuario ya escribió algo
 * @returns {HTMLElement}
 */
export function buildLoanTypeFields(loanType, values = {}) {
  const container = document.createElement('div');
  container.className = 'form-grid';
  container.style.gap = '16px';

  if (loanType === 'FIXED_INTEREST') {
    const grid = document.createElement('div');
    grid.className = 'form-grid form-grid-2';
    grid.style.gap = '16px';
    grid.appendChild(inputGroup({
      id: 'lCapitalOriginal',
      label: 'Capital ($)',
      type: 'number',
      required: true,
      min: 0.01,
      step: '0.01',
      value: values.capitalOriginal || '',
      placeholder: '0.00',
    }));
    grid.appendChild(inputGroup({
      id: 'lInteresMensual',
      label: 'Interés mensual fijo ($)',
      type: 'number',
      required: true,
      min: 0.01,
      step: '0.01',
      value: values.interesMensual || '',
      placeholder: '0.00',
    }));
    container.appendChild(grid);
    container.appendChild(inputGroup({
      id: 'lFechaInicio',
      label: 'Fecha de inicio',
      type: 'date',
      value: values.fechaInicio || new Date().toISOString().split('T')[0],
    }));
    return container;
  }

  if (loanType === 'INSTALLMENTS') {
    const grid = document.createElement('div');
    grid.className = 'form-grid form-grid-2';
    grid.style.gap = '16px';
    grid.appendChild(inputGroup({
      id: 'lCapitalOriginal',
      label: 'Capital ($)',
      type: 'number',
      required: true,
      min: 0.01,
      step: '0.01',
      value: values.capitalOriginal || '',
      placeholder: '0.00',
    }));
    grid.appendChild(inputGroup({
      id: 'lPorcentajeInteres',
      label: 'Interés mensual (%)',
      type: 'number',
      required: true,
      min: 1,
      max: 20,
      step: '1',
      value: values.porcentajeInteres || '',
      placeholder: '1-20',
    }));
    container.appendChild(grid);
    container.appendChild(inputGroup({
      id: 'lMeses',
      label: 'Plazo (meses)',
      type: 'number',
      required: true,
      min: 1,
      max: 12,
      step: '1',
      value: values.meses || '',
      placeholder: '1-12',
    }));
    container.appendChild(inputGroup({
      id: 'lFechaInicio',
      label: 'Fecha de inicio',
      type: 'date',
      value: values.fechaInicio || new Date().toISOString().split('T')[0],
    }));

    const previewBox = document.createElement('div');
    previewBox.id = 'installmentsPreview';
    previewBox.style.cssText = 'padding:14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);font-size:12px;color:var(--text3);';
    previewBox.textContent = 'Completa capital, % y meses para ver el cálculo';
    container.appendChild(previewBox);

    return container;
  }

  // NORMAL — igual que siempre (mismos IDs que loanModal ya usa)
  const grid2 = document.createElement('div');
  grid2.className = 'form-grid form-grid-2';
  grid2.style.gap = '16px';
  grid2.appendChild(inputGroup({
    id: 'lAmount',
    label: 'Capital ($)',
    type: 'number',
    required: true,
    min: 0.01,
    step: '0.01',
    value: values.amount || '',
    placeholder: '0.00',
  }));
  grid2.appendChild(inputGroup({
    id: 'lInterest',
    label: 'Interes ($)',
    type: 'number',
    required: true,
    min: 0,
    step: '0.01',
    value: values.interest || '',
    placeholder: '0.00',
  }));
  container.appendChild(grid2);

  const grid2b = document.createElement('div');
  grid2b.className = 'form-grid form-grid-2';
  grid2b.style.gap = '16px';
  grid2b.appendChild(inputGroup({ id: 'lDueDate', label: 'Fecha de vencimiento', type: 'date', required: true, value: values.dueDate || '' }));
  grid2b.appendChild(inputGroup({ id: 'lPayDate', label: 'Fecha de pago', type: 'date', value: values.paymentDate || '' }));
  container.appendChild(grid2b);

  return container;
}