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
