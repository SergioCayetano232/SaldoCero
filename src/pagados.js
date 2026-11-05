import { pagoEnElGasto } from "./pagadores";

// "puso 240 € en 6 gastos": cuántos ha pagado cada uno, no en cuántos va.
// Los pagados a medias también cuentan, que también sacó la cartera.
export function cuantosPago(gastos, viajeroId) {
  return gastos.filter((g) => pagoEnElGasto(g, viajeroId)).length;
}

export function textoPagados(cuantos) {
  if (!(cuantos > 0)) return null;
  return `en ${cuantos} ${cuantos === 1 ? "gasto" : "gastos"}`;
}
