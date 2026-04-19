export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

export function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
}

export function formatDateInput(date) {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
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

export function isOverdue(dueDate, status) {
  if (status === 'PAID') return false;
  return new Date(dueDate) < new Date();
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
