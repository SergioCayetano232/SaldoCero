// El gasto a medio escribir, para no perderlo si se cierra la app. En el móvil
// pasa sin avisar: cambias a WhatsApp y el sistema te la cierra por detrás.

import { BOTE } from "./bote";

// Uno de hace días ya no es "lo que estabas apuntando", es un estorbo.
const CADUCA = 2 * 24 * 60 * 60 * 1000;

const TEXTOS = ["importe", "moneda", "concepto", "categoria", "nota", "fecha"];

// Sin importe, concepto ni nota no hay nada que guardar: el pagador solo se
// queda puesto a propósito para encadenar gastos.
export function hayAlgoEscrito(borrador) {
  return ["importe", "concepto", "nota"].some((campo) => String(borrador?.[campo] ?? "").trim() !== "");
}

// Lo guardado, si aún sirve. null si no.
export function borradorQueVale(guardado, ahora, viajeros) {
  if (!guardado || typeof guardado !== "object") return null;
  if (!(ahora - guardado.guardadoEn <= CADUCA)) return null;
  if (!hayAlgoEscrito(guardado)) return null;

  const limpio = Object.fromEntries(TEXTOS.map((campo) => [campo, String(guardado[campo] ?? "")]));
  // El que pagó puede haberse ido del viaje mientras tanto.
  const sigue = guardado.pagadorId === BOTE || viajeros.some((v) => v.id === guardado.pagadorId);

  return {
    ...limpio,
    pagadorId: sigue ? guardado.pagadorId : "",
    categoriaAMano: guardado.categoriaAMano === true,
  };
}
