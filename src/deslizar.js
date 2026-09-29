// Deslizar una fila con el dedo: a la izquierda quita, a la derecha edita.

// Hasta aquí no se mueve nada, que un dedo nunca está quieto del todo.
export const HOLGURA = 8;

// Cuánto hay que arrastrar para que valga. Un tercio largo de la fila, con tope
// para que en tablet no haya que cruzar media pantalla.
export function umbral(ancho) {
  return Math.min(ancho * 0.35, 110);
}

// Solo es deslizar si va claramente de lado. Si no, es que quiere hacer scroll.
export function esHorizontal(dx, dy) {
  return Math.abs(dx) > HOLGURA && Math.abs(dx) > Math.abs(dy) * 1.5;
}

// Pasado el umbral la fila sigue al dedo, pero frenando, como una goma.
export function conResistencia(dx, ancho) {
  const tope = umbral(ancho);
  if (Math.abs(dx) <= tope) return dx;

  return Math.sign(dx) * (tope + (Math.abs(dx) - tope) * 0.3);
}

// Qué pasa si sueltas ahora.
export function queHacer(dx, ancho) {
  // Sin medir la fila todavía, el umbral sería 0 y cualquier cosa valdría.
  if (dx === 0 || ancho <= 0) return null;

  const tope = umbral(ancho);
  if (dx <= -tope) return "quitar";
  if (dx >= tope) return "editar";
  return null;
}
