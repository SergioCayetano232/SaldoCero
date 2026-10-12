// Lo que sale cada uno de un gasto, que es lo primero que pregunta todo el mundo.

import { calcularTotal, participantesDeGasto, repartoDeGasto } from "./calculos";

// Solo si va a partes iguales: repartido desigual no hay una cifra que dar.
// Y con uno solo tampoco, que ya es el importe.
export function porCabeza(gasto, viajeros) {
  const partes = [...repartoDeGasto(gasto, participantesDeGasto(gasto, viajeros)).values()];
  if (partes.length < 2) return null;

  const iguales = partes.every((p) => Math.abs(p - partes[0]) < 0.005);
  return iguales ? partes[0] : null;
}

// Lo de un día entre todos, como el "por cabeza y día" del resumen. Es una media:
// si alguno no fue a la cena, a él le toca menos.
export function porCabezaDelDia(gastos, cuantos) {
  const total = calcularTotal(gastos);
  if (cuantos < 2 || !(total > 0)) return null;
  return total / cuantos;
}
