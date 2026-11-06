// "¿Esto qué es?" en un gasto, para no tener que preguntarlo por el chat.

import { BOTE } from "./bote";
import { idsDeQuienPago } from "./pagadores";

export const LARGO_DUDA = 140;
export const DUDA_POR_DEFECTO = "¿Esto qué es?";

// Vacío vale: con darle al botón ya se entiende la pregunta.
export function limpiarDuda(texto) {
  const limpio = String(texto ?? "").replace(/\s+/g, " ").trim().slice(0, LARGO_DUDA);
  return limpio || DUDA_POR_DEFECTO;
}

// Se le pregunta al que lo apuntó. Si no se sabe, al que pagó, si fue uno solo.
export function aQuienSePregunta(gasto) {
  if (gasto.creadoPor) return gasto.creadoPor;
  const pagadores = idsDeQuienPago(gasto);
  return pagadores.length === 1 && pagadores[0] !== BOTE ? pagadores[0] : null;
}

// Las que te tocan contestar a ti. Las tuyas no, que ya sabes lo que preguntaste.
export function dudasParaMi(gastos, soy) {
  if (!soy) return [];
  return gastos.filter((g) => g.duda && g.dudaPor !== soy && aQuienSePregunta(g) === soy);
}

export function textoDuda(gasto, viajeros, soy) {
  if (!gasto.duda) return null;
  if (gasto.dudaPor && gasto.dudaPor === soy) return `Has preguntado: ${gasto.duda}`;
  const quien = viajeros.find((v) => v.id === gasto.dudaPor)?.nombre ?? "Alguien";
  return `${quien} pregunta: ${gasto.duda}`;
}

export function avisoDeDudas(dudas, viajeros) {
  if (dudas.length === 0) return null;
  if (dudas.length > 1) return `Te han preguntado por ${dudas.length} gastos`;

  const [g] = dudas;
  const quien = viajeros.find((v) => v.id === g.dudaPor)?.nombre ?? "Alguien";
  return `${quien} te pregunta por "${g.concepto}": ${g.duda}`;
}
