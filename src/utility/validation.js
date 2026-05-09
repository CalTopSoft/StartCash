export const FIELD_LIMITS = {
  name: { min: 2, max: 80 },
  email: { min: 6, max: 120 },
  password: { min: 6, max: 72 },
  phone: { min: 7, max: 20 },
  address: { min: 0, max: 160 },
  loanDescription: { min: 0, max: 300 },
  money: { min: 0.01, max: 100000000 },
  interest: { min: 0, max: 100000000 },
  search: { min: 0, max: 80 },
};

export function validateRequiredText(value, limits, label) {
  const v = String(value || '').trim();
  if (!v) return `${label} es requerido`;
  if (v.length < limits.min) return `${label} debe tener al menos ${limits.min} caracteres`;
  if (v.length > limits.max) return `${label} no debe superar ${limits.max} caracteres`;
  return null;
}

export function validateOptionalText(value, limits, label) {
  const v = String(value || '').trim();
  if (!v) return null;
  if (limits.min && v.length < limits.min) return `${label} debe tener al menos ${limits.min} caracteres`;
  if (v.length > limits.max) return `${label} no debe superar ${limits.max} caracteres`;
  return null;
}

export function validateNumberRange(value, limits, label) {
  if (Number.isNaN(value)) return `${label} invalido`;
  if (value < limits.min) return `${label} debe ser mayor o igual a ${limits.min}`;
  if (value > limits.max) return `${label} no debe superar ${limits.max}`;
  return null;
}

