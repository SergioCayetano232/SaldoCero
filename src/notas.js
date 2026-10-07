// La nota de un gasto: "incluye la propina", "Luis no tomó postre"...

// Lo justo para una aclaración. Para más, ya está el ticket.
export const LARGO_NOTA = 200;

// Una línea, sin espacios de sobra. Vacía, null: así no se guardan notas en blanco.
export function limpiarNota(texto) {
  const limpia = String(texto ?? "").replace(/\s+/g, " ").trim().slice(0, LARGO_NOTA);
  return limpia || null;
}

// Lo que queda solo se enseña cerca del tope; antes sería ruido.
export function quedanEnNota(texto) {
  const quedan = LARGO_NOTA - String(texto ?? "").length;
  return quedan <= 40 ? quedan : null;
}
