// Quién apuntó cada gasto, para saber a quién preguntar "¿esto qué era?".
// Sale de quien hayas marcado como tú. Si no has marcado a nadie, no se sabe.

import { idsDeQuienPago } from "./pagadores";

// Null si no hace falta decirlo: no se sabe, ya no está en el viaje, o lo
// apuntó el mismo que pagó, que es lo normal y ya sale su nombre.
export function apuntadoPor(gasto, viajeros, soy = null) {
  const id = gasto.creadoPor;
  if (!id) return null;

  const quien = viajeros.find((v) => v.id === id);
  if (!quien) return null;

  const pagadores = idsDeQuienPago(gasto);
  if (pagadores.length === 1 && pagadores[0] === id) return null;

  return id === soy ? "apuntado por ti" : `apuntado por ${quien.nombre}`;
}
