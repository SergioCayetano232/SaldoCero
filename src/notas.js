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

// La nota partida en texto y enlaces, para que el de la reserva se pueda tocar.
// Solo http y www: nada de "javascript:" metido en una nota.
const ENLACE = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi;

export function trozosConEnlaces(texto) {
  const nota = String(texto ?? "");
  const trozos = [];
  let desde = 0;

  for (const m of nota.matchAll(ENLACE)) {
    // El punto o el paréntesis del final son de la frase, no del enlace.
    const enlace = m[0].replace(/[.,;:!?)]+$/, "");
    if (m.index > desde) trozos.push({ texto: nota.slice(desde, m.index) });
    trozos.push({ texto: enlace, href: /^www\./i.test(enlace) ? `https://${enlace}` : enlace });
    desde = m.index + enlace.length;
  }

  if (desde < nota.length) trozos.push({ texto: nota.slice(desde) });
  return trozos;
}
