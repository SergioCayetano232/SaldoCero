import { useRef, useState } from "react";
import { esHorizontal, conResistencia, queHacer, HOLGURA } from "../deslizar";
import { vibrar } from "../vibrar";

// Una fila de la lista que se puede arrastrar de lado con el dedo.
function Deslizable({ className = "", onEditar, onQuitar, children }) {
  const [dx, setDx] = useState(0);
  const [ancho, setAncho] = useState(0);
  const [soltada, setSoltada] = useState(true);
  // Dónde empezó el dedo y si ya sabemos si va de lado o es scroll.
  const toque = useRef(null);

  function alBajar(e) {
    // Con ratón están los botones, esto es para el móvil.
    if (e.pointerType === "mouse") return;

    toque.current = { x: e.clientX, y: e.clientY, modo: null };
    setAncho(e.currentTarget.offsetWidth);
    setSoltada(false);
  }

  function alMover(e) {
    const t = toque.current;
    if (!t) return;

    const mx = e.clientX - t.x;
    const my = e.clientY - t.y;

    if (t.modo === null) {
      if (Math.abs(mx) < HOLGURA && Math.abs(my) < HOLGURA) return;
      t.modo = esHorizontal(mx, my) ? "lado" : "scroll";
      if (t.modo === "lado") e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (t.modo !== "lado") return;
    const nuevo = conResistencia(mx, ancho);

    // Un toque justo al pasar el umbral: así sabes que ya vale sin mirar.
    const ahora = queHacer(nuevo, ancho);
    if (ahora && ahora !== queHacer(dx, ancho)) vibrar("toque");

    setDx(nuevo);
  }

  function alSoltar() {
    const eraDeLado = toque.current?.modo === "lado";
    toque.current = null;
    setSoltada(true);

    if (!eraDeLado) return setDx(0);

    const accion = queHacer(dx, ancho);

    if (accion === "quitar") {
      // Que se vaya del todo antes de quitarla, si no parece que rebota.
      setDx(-ancho);
      setTimeout(onQuitar, 180);
    } else {
      setDx(0);
      if (accion === "editar") onEditar();
    }
  }

  // Si el navegador se queda el gesto a medias, vuelta a su sitio y nada más.
  function alCancelar() {
    toque.current = null;
    setSoltada(true);
    setDx(0);
  }

  const lista = queHacer(dx, ancho);

  return (
    <li
      className={`deslizable ${className} ${lista ? `listo-${lista}` : ""} ${soltada ? "soltada" : ""}`}
      style={{ transform: dx ? `translateX(${dx}px)` : undefined, "--dx": `${dx}px` }}
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alCancelar}
    >
      {children}
    </li>
  );
}

export default Deslizable;
