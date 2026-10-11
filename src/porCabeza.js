// Lo que sale cada uno de un gasto, que es lo primero que pregunta todo el mundo.

import { participantesDeGasto, repartoDeGasto } from "./calculos";

// Solo si va a partes iguales: repartido desigual no hay una cifra que dar.
// Y con uno solo tampoco, que ya es el importe.
export function porCabeza(gasto, viajeros) {
  const partes = [...repartoDeGasto(gasto, participantesDeGasto(gasto, viajeros)).values()];
  if (partes.length < 2) return null;

  const iguales = partes.every((p) => Math.abs(p - partes[0]) < 0.005);
  return iguales ? partes[0] : null;
}
