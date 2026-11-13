// Un brillo en la tarjeta que sigue al ratón. El CSS pinta la luz; esto solo
// le dice dónde está el puntero, en píxeles desde la esquina de la tarjeta.

export function dondeLaLuz(x, y, caja) {
  return { x: Math.round(x - caja.left), y: Math.round(y - caja.top) };
}

// Con el dedo no hay nada que seguir, y al tocar se quedaría la luz puesta.
export function esRaton(evento) {
  return evento.pointerType === "mouse" || evento.pointerType === "pen";
}

export function seguirLaLuz(doc = document) {
  let pendiente = null;

  function alMover(e) {
    if (!esRaton(e)) return;
    const tarjeta = e.target.closest?.(".tarjeta");
    if (!tarjeta) return;
    // Una vez por fotograma basta; pointermove llega muchas más veces.
    if (pendiente) cancelAnimationFrame(pendiente);
    pendiente = requestAnimationFrame(() => {
      const { x, y } = dondeLaLuz(e.clientX, e.clientY, tarjeta.getBoundingClientRect());
      tarjeta.style.setProperty("--luz-x", `${x}px`);
      tarjeta.style.setProperty("--luz-y", `${y}px`);
    });
  }

  doc.addEventListener("pointermove", alMover, { passive: true });
  return () => doc.removeEventListener("pointermove", alMover);
}
