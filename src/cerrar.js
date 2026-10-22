// Un viaje cerrado ya no cambia: solo se pagan las deudas.

import { enCorto } from "./fechas";
import { conMoneda } from "./monedas";
import { quedaPorPagar } from "./calculos";

// Los viajes de antes no traen cerradoEn: abiertos.
export function estaCerrado(viaje) {
  return Boolean(viaje?.cerradoEn);
}

// "Cerrado el vie, 11 sept", con el día de este móvil, que es quien lo lee.
export function textoCerrado(cerradoEn) {
  return `Cerrado el ${enCorto(new Date(cerradoEn).toLocaleDateString("sv-SE"))}`;
}

// Lo que se pregunta antes de cerrar. Si aún hay deudas no se impide, que
// cerrado se pueden seguir pagando, pero que se sepa.
export function avisoAlCerrar(nombre, pagos, moneda = "EUR") {
  const pregunta = `¿Cerrar "${nombre}"? Nadie podrá apuntar, cambiar ni quitar gastos. Se puede reabrir.`;
  const sinPagar = pagos.filter((p) => !p.saldado);
  if (sinPagar.length === 0) return pregunta;

  const cuantos = sinPagar.length === 1 ? "queda 1 pago" : `quedan ${sinPagar.length} pagos`;
  return `${pregunta}\n\nOjo: aún ${cuantos} sin hacer (${conMoneda(quedaPorPagar(pagos), moneda)}). Se podrán seguir marcando como pagados.`;
}

// Tres días sin que nadie apunte nada suele ser que ya habéis vuelto.
export const DIAS_PARA_SUGERIR = 3;
const UN_DIA = 24 * 60 * 60 * 1000;

// Cuándo se apuntó lo último. Va por creadoEn y no por la fecha del gasto: la
// cena del viernes apuntada el lunes es que el viaje sigue vivo.
export function ultimoApunte(gastos) {
  const momentos = gastos.map((g) => g.creadoEn ?? g.fecha).filter(Boolean);
  if (momentos.length === 0) return null;
  return momentos.reduce((max, m) => (new Date(m) > new Date(max) ? m : max));
}

// Los días que lleva parado, si toca sugerir cerrarlo. Si ya dijiste "aún no"
// a ese mismo último apunte, no se vuelve a sacar hasta que haya otro.
export function sugerirCerrar({ gastos, cerrado, descartado = null, ahora = Date.now() }) {
  if (cerrado) return null;

  const ultimo = ultimoApunte(gastos);
  if (!ultimo || ultimo === descartado) return null;

  const dias = Math.floor((ahora - new Date(ultimo)) / UN_DIA);
  return dias >= DIAS_PARA_SUGERIR ? dias : null;
}
