// La onda que sale del punto donde pulsas un botón. El CSS la dibuja; esto le
// dice el centro y lo grande que tiene que hacerse.

// Hasta la esquina más lejana, para que llegue a cubrir el botón entero.
export function radioDeLaOnda(x, y, ancho, alto) {
  const dx = Math.max(x, ancho - x);
  const dy = Math.max(y, alto - y);
  return Math.ceil(Math.hypot(dx, dy));
}

// Alterno entre dos nombres de animación: al cambiarlo, el navegador la vuelve
// a empezar aunque pulses dos veces seguidas, sin trucos de reflow.
export function siguienteOnda(actual) {
  return actual === "a" ? "b" : "a";
}

export function ondearBotones(doc = document) {
  function alPulsar(e) {
    const boton = e.target.closest?.("button");
    if (!boton || boton.disabled) return;
    const caja = boton.getBoundingClientRect();
    const x = e.clientX - caja.left;
    const y = e.clientY - caja.top;
    boton.style.setProperty("--onda-x", `${Math.round(x)}px`);
    boton.style.setProperty("--onda-y", `${Math.round(y)}px`);
    boton.style.setProperty("--onda-r", `${radioDeLaOnda(x, y, caja.width, caja.height)}px`);
    boton.dataset.onda = siguienteOnda(boton.dataset.onda);
  }

  doc.addEventListener("pointerdown", alPulsar, { passive: true });
  return () => doc.removeEventListener("pointerdown", alPulsar);
}

// Las casillas dan un saltito al marcarlas o desmarcarlas. Con change y no con
// :checked en el CSS, que si no saltarían todas al cargar las que ya vienen puestas.
export function saltarCasillas(doc = document) {
  function alCambiar(e) {
    const casilla = e.target;
    if (casilla.type !== "checkbox" && casilla.type !== "radio") return;
    casilla.dataset.salto = siguienteOnda(casilla.dataset.salto);
  }

  doc.addEventListener("change", alCambiar);
  return () => doc.removeEventListener("change", alCambiar);
}
