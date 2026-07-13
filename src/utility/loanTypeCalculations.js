/**
 * loanTypeCalculations.js
 *
 * Espejo en frontend de las fórmulas de `loanCalculations.ts` (backend),
 * usado SOLO para mostrar el preview en tiempo real dentro del modal de
 * creación de préstamo (Modo 3: diferidos). El backend vuelve a calcular
 * y persiste los valores reales al guardar — esto es únicamente UI.
 */

export const INSTALLMENTS_MIN_PERCENT = 1;
export const INSTALLMENTS_MAX_PERCENT = 20;
export const INSTALLMENTS_MIN_MONTHS = 1;
export const INSTALLMENTS_MAX_MONTHS = 12;

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function addMonths(date, months) {
  const result = new Date(date.getTime());
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Calcula los valores derivados de un préstamo a diferidos (interés simple).
 * Mismas fórmulas que el backend:
 *   interesTotal = capital * (porcentaje/100 * meses)
 *   totalAPagar  = capital + interesTotal
 *   cuotaMensual = totalAPagar / meses
 *   gananciaMensual = interesTotal / meses
 */
export function calculateInstallments({ capital, porcentajeInteres, meses, fechaInicio }) {
  if (!capital || !porcentajeInteres || !meses || capital <= 0 || meses <= 0) {
    return null;
  }

  const tasa = porcentajeInteres / 100;
  const interesTotal = round2(capital * (tasa * meses));
  const totalAPagar = round2(capital + interesTotal);
  const cuotaMensual = round2(totalAPagar / meses);
  const gananciaTotal = interesTotal;
  const gananciaMensual = round2(interesTotal / meses);

  const base = fechaInicio ? new Date(fechaInicio) : new Date();
  const fechaPrimerPago = addMonths(base, 1);
  const fechaUltimoPago = addMonths(base, meses);

  return {
    capitalOriginal: capital,
    porcentajeInteres,
    meses,
    interesTotal,
    totalAPagar,
    cuotaMensual,
    gananciaTotal,
    gananciaMensual,
    fechaPrimerPago,
    fechaUltimoPago,
  };
}