// Las cifras del resumen van subiendo o bajando hasta la nueva, en vez de saltar.

import { useEffect, useRef, useState } from "react";

export const DURACION = 700;

// Frena al final, como la curva suave del CSS.
export function frenando(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Por dónde va la cifra con la animación a medias (progreso de 0 a 1).
export function valorEnMomento(desde, hasta, progreso) {
  const t = Math.min(Math.max(progreso, 0), 1);
  return desde + (hasta - desde) * frenando(t);
}

function sinMovimiento() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// Empieza en cero a propósito: al abrir el viaje, el total sube desde abajo.
export function useCifraAnimada(valor, duracion = DURACION) {
  const [mostrado, setMostrado] = useState(0);
  const actual = useRef(0);

  useEffect(() => {
    if (sinMovimiento()) return;

    const desde = actual.current;
    if (desde === valor) return;

    let inicio = null;
    let cuadro;

    function paso(ahora) {
      inicio ??= ahora;
      const cifra = valorEnMomento(desde, valor, (ahora - inicio) / duracion);

      actual.current = cifra;
      setMostrado(cifra);

      if (ahora - inicio < duracion) cuadro = requestAnimationFrame(paso);
    }

    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [valor, duracion]);

  // Con el movimiento reducido, la cifra de verdad y ya.
  return sinMovimiento() ? valor : mostrado;
}
