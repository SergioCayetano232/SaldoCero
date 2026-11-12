// Las reacciones a los gastos. Una por viajero y gasto, como en WhatsApp:
// otra la cambia y la misma la quita.

import { enLista } from "./nombres";

// Las mismas que deja la base de datos. Si se añade una, allí también.
export const REACCIONES = ["👍", "😂", "😱", "🤔"];

// Lo que llega de la base de datos, agrupado por gasto. Las que no son de las
// nuestras se tiran, por si alguna vez se quita una.
export function reaccionesPorGasto(filas = []) {
  const porGasto = new Map();
  for (const fila of filas) {
    if (!REACCIONES.includes(fila.emoji)) continue;
    const lista = porGasto.get(fila.gasto_id) ?? [];
    lista.push({ viajeroId: fila.viajero_id, emoji: fila.emoji });
    porGasto.set(fila.gasto_id, lista);
  }
  return porGasto;
}

// Qué hay que hacer al tocar una: ponerla, cambiar la que tenías o quitarla.
export function alTocar(reacciones = [], soy, emoji) {
  const mia = reacciones.find((r) => r.viajeroId === soy);
  if (!mia) return "poner";
  return mia.emoji === emoji ? "quitar" : "cambiar";
}

// Cómo quedan antes de que conteste el servidor, para que se vea al momento.
export function trasTocar(reacciones = [], soy, emoji) {
  const sinLaMia = reacciones.filter((r) => r.viajeroId !== soy);
  return alTocar(reacciones, soy, emoji) === "quitar" ? sinLaMia : [...sinLaMia, { viajeroId: soy, emoji }];
}

// Las pastillas de debajo del gasto: "👍 2", con quién la ha puesto para el
// title. En el orden de siempre, no en el que llegaron.
// Si el viajero ya no está, cuenta igual pero sin nombre.
export function pastillas(reacciones = [], viajeros = [], soy = null) {
  return REACCIONES.map((emoji) => {
    const suyas = reacciones.filter((r) => r.emoji === emoji);
    const nombres = suyas.map((r) => viajeros.find((v) => v.id === r.viajeroId)?.nombre).filter(Boolean);
    return { emoji, cuantos: suyas.length, quienes: enLista(nombres), mia: suyas.some((r) => r.viajeroId === soy) };
  }).filter((p) => p.cuantos > 0);
}
