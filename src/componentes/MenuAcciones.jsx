import { useEffect, useId, useRef, useState } from "react";

// Lo que se hace con una fila y no es lo de siempre, recogido tras "⋯".
// Lo peligroso (borrar, quitar) va el último y apartado, nunca junto a editar.
//
// acciones: [{ texto, alPulsar?, href?, pulsado?, peligro? }]; las que vengan
// vacías (null, false) no salen.
function MenuAcciones({ etiqueta, acciones }) {
  const [abierto, setAbierto] = useState(false);
  // Abajo de la pantalla no cabe hacia abajo (y la barra lo taparía): sube.
  const [haciaArriba, setHaciaArriba] = useState(false);
  const id = useId();
  const caja = useRef(null);
  const boton = useRef(null);
  const visibles = acciones.filter(Boolean);
  const normales = visibles.filter((a) => !a.peligro);
  const peligrosas = visibles.filter((a) => a.peligro);

  useEffect(() => {
    if (!abierto) return;

    function fuera(e) {
      if (!caja.current?.contains(e.target)) setAbierto(false);
    }

    function alPulsar(e) {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setAbierto(false);
      boton.current?.focus();
    }

    // Al abrirlo, el foco va a la primera opción, que es lo que se espera
    // con el teclado. Con el dedo no molesta.
    caja.current?.querySelector(".menu-acciones-lista button, .menu-acciones-lista a")?.focus();
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", alPulsar, true);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", alPulsar, true);
    };
  }, [abierto]);

  if (visibles.length === 0) return null;

  function elegir(accion) {
    setAbierto(false);
    accion.alPulsar?.();
  }

  function opcion(accion) {
    const clase = `menu-acciones-opcion ${accion.peligro ? "peligro" : ""}`;
    return (
      <li key={accion.texto}>
        {accion.href ? (
          <a className={clase} href={accion.href} target="_blank" rel="noopener noreferrer" onClick={() => setAbierto(false)}>
            {accion.texto}
          </a>
        ) : (
          <button className={clase} onClick={() => elegir(accion)} aria-pressed={accion.pulsado}>
            {accion.texto}
          </button>
        )}
      </li>
    );
  }

  return (
    <span className="menu-acciones" ref={caja}>
      <button
        ref={boton}
        className="menu-acciones-boton"
        aria-label={etiqueta}
        title={etiqueta}
        aria-expanded={abierto}
        aria-controls={id}
        onClick={(e) => {
          const borde = e.currentTarget.getBoundingClientRect();
          setHaciaArriba(borde.bottom > window.innerHeight * 0.55);
          setAbierto((a) => !a);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {abierto && (
        <ul className={`menu-acciones-lista ${haciaArriba ? "hacia-arriba" : ""}`} id={id} aria-label={etiqueta}>
          {normales.map(opcion)}
          {peligrosas.length > 0 && <li className="menu-acciones-separador" aria-hidden="true" />}
          {peligrosas.map(opcion)}
        </ul>
      )}
    </span>
  );
}

export default MenuAcciones;

