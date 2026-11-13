import { esRaton } from "./luz";

// El total se inclina hacia el ratón, como una tarjeta de crédito en la mano.
// Seis grados de máximo: más ya marea y cuesta leer la cifra.
const MAXIMO = 6;

// Ratón a la derecha, gira sobre el eje Y hacia allí; abajo, sobre el X.
export function inclinacion(x, y, ancho, alto, maximo = MAXIMO) {
  const dx = Math.min(Math.max(x / ancho, 0), 1) - 0.5;
  const dy = Math.min(Math.max(y / alto, 0), 1) - 0.5;
  const redondo = (n) => Math.round(n * 100) / 100 + 0;
  return { x: redondo(-dy * 2 * maximo), y: redondo(dx * 2 * maximo) };
}

export function inclinarElTotal(doc = document) {
  let pendiente = null;
  let actual = null;

  function soltar() {
    if (!actual) return;
    actual.style.removeProperty("--giro-x");
    actual.style.removeProperty("--giro-y");
    actual.style.removeProperty("--reflejo-x");
    actual.style.removeProperty("--reflejo-y");
    actual = null;
  }

  function alMover(e) {
    if (!esRaton(e)) return;
    const total = e.target.closest?.(".total-destacado");
    if (total !== actual) soltar();
    if (!total) return;
    actual = total;
    if (pendiente) cancelAnimationFrame(pendiente);
    pendiente = requestAnimationFrame(() => {
      const caja = total.getBoundingClientRect();
      const x = e.clientX - caja.left;
      const y = e.clientY - caja.top;
      const giro = inclinacion(x, y, caja.width, caja.height);
      total.style.setProperty("--giro-x", `${giro.x}deg`);
      total.style.setProperty("--giro-y", `${giro.y}deg`);
      // El reflejo va a donde está el ratón, como la luz en un plástico.
      total.style.setProperty("--reflejo-x", `${Math.round((x / caja.width) * 100)}%`);
      total.style.setProperty("--reflejo-y", `${Math.round((y / caja.height) * 100)}%`);
    });
  }

  // Se suelta al pasar el ratón a cualquier otra cosa de la página.
  doc.addEventListener("pointermove", alMover, { passive: true });
  return () => doc.removeEventListener("pointermove", alMover);
}
