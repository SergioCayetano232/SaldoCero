import { pagoEnElGasto } from "./pagadores";
import { tn } from "./idioma";

// "puso 240 € en 6 gastos": cuántos ha pagado cada uno, no en cuántos va.
// Los pagados a medias también cuentan, que también sacó la cartera.
export function cuantosPago(gastos, viajeroId) {
  return gastos.filter((g) => pagoEnElGasto(g, viajeroId)).length;
}

export function textoPagados(cuantos) {
  if (!(cuantos > 0)) return null;
  return tn(cuantos, "en 1 gasto", "en {n} gastos");
}
