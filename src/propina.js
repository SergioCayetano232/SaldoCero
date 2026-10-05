// La propina de un toque. Va como un sumando más ("40+4"), así se ve qué es el
// gasto y qué la propina, y se puede retocar a mano.

import { leerSuma } from "./sumas";

export const PROPINAS = [5, 10];

// Con coma, como se escribe aquí, y sin ceros de más: 4, 4,5, 2,05.
function comoTexto(n) {
  return String(Math.round(n * 100) / 100).replace(".", ",");
}

// null si el importe no se entiende o es cero: no hay sobre qué calcularla.
export function conPropina(importe, porcentaje) {
  const base = leerSuma(importe);
  if (!base) return null;

  const propina = Math.round(base * porcentaje) / 100;
  if (propina <= 0) return null;

  return `${String(importe).trim().replace(/\+$/, "")}+${comoTexto(propina)}`;
}
