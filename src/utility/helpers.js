export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

export function formatDateInput(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function loanStatusLabel(status) {
  const map = { PENDING: 'Pendiente', PARTIALLY_PAID: 'Parcial', PAID: 'Pagado' };
  return map[status] || status;
}

export function loanStatusClass(status) {
  const map = { PENDING: 'yellow', PARTIALLY_PAID: 'accent', PAID: 'green' };
  return `badge badge-${map[status] || 'yellow'}`;
}

export function calcProgress(amountPaid, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((amountPaid / total) * 100));
}

// Parsea "YYYY-MM-DD" como fecha LOCAL, no UTC
function parseDateLocal(value) {
  if (!value) return new Date(NaN);
  const s = typeof value === 'string' ? value : new Date(value).toISOString();
  // Si viene como ISO "2025-05-08T..." toma solo la parte de fecha
  const datePart = s.slice(0, 10); // "YYYY-MM-DD"
  const [y, m, d] = datePart.split('-').map(Number);
  return new Date(y, m - 1, d); // medianoche hora LOCAL
}

export function formatDate(date) {
  if (!date) return '—';
  const d = parseDateLocal(date);
  return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function isOverdue(dueDate, status) {
  if (status === 'PAID') return false;
  const due = parseDateLocal(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // medianoche local de hoy
  return due < today; // vence hoy → NO está vencido
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeText(value) {
  return value.replace(/[<>]/g, '');
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
export function loanTypeLabel(loanType) {
  const map = {
    NORMAL: 'Normal',
    FIXED_INTEREST: 'Interés fijo',
    INSTALLMENTS: 'Diferidos',
  };
  return map[loanType] || 'Normal';
}

export function loanTypeIcon(loanType) {
  const map = {
    NORMAL: 'money',
    FIXED_INTEREST: 'clock',
    INSTALLMENTS: 'calendar',
  };
  return map[loanType] || 'money';
}
 
export function loanTypeColor(loanType) {
  const map = {
    NORMAL: 'var(--green)',
    FIXED_INTEREST: 'var(--yellow)',
    INSTALLMENTS: 'var(--accent2)',
  };
  return map[loanType] || 'var(--green)';
}