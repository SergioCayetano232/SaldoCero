import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DURA_CADA_UNA, siguienteHistoria } from "../historias";
import { esAtajoParar, esOrdenador } from "../teclado";

// Más de esto pulsado es para pararla y leer con calma, no un toque.
const ES_PARAR = 250;

function Historias({ historias, onCerrar }) {
  const [actual, setActual] = useState(0);
  const [parada, setParada] = useState(false);
  const pulsado = useRef(0);
  const boton = useRef(null);
  // Sin movimiento no corre sola: la barra no se ve avanzar y te la quitaría a medias.
  const [quieta] = useState(() => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));

  const historia = historias[actual];
  const ultima = actual === historias.length - 1;

  function ir(haciaAtras) {
    const siguiente = siguienteHistoria(actual, historias.length, haciaAtras);
    if (siguiente === null) onCerrar();
    else setActual(siguiente);
  }

  useEffect(() => {
    boton.current?.focus();
    // Que la página de detrás no se mueva mientras.
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, []);

  useEffect(() => {
    function alPulsar(e) {
      if (e.key === "Escape") onCerrar();
      else if (e.key === "ArrowRight") setActual((i) => siguienteHistoria(i, historias.length, false) ?? i);
      else if (e.key === "ArrowLeft") setActual((i) => siguienteHistoria(i, historias.length, true));
      else if (esAtajoParar(e)) {
        // Si no, el espacio pulsa el botón que tenga el foco, y el primero es cerrar.
        e.preventDefault();
        setParada((p) => !p);
      }
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [historias.length, onCerrar]);

  function alSoltar(e) {
    setParada(false);
    if (Date.now() - pulsado.current > ES_PARAR) return;

    const { left, width } = e.currentTarget.getBoundingClientRect();
    ir(e.clientX - left < width / 3);
  }

  // Fuera de la tarjeta: con su backdrop-filter, el fixed se quedaba dentro de ella.
  return createPortal(
    <div
      className={`historias historia-tono-${actual % 5}`}
      role="dialog"
      aria-modal="true"
      aria-label="El viaje en historias"
    >
      <div className="historias-barras">
        {historias.map((h, i) => (
          <span key={h.id} className="historias-barra">
            <span
              // Con la key, al volver a una se reinicia la barra.
              key={i === actual ? `en-${actual}` : h.id}
              className={i < actual || (i === actual && quieta) ? "llena" : i === actual ? "corriendo" : ""}
              style={{
                animationDuration: `${DURA_CADA_UNA}ms`,
                animationPlayState: parada ? "paused" : "running",
              }}
              // La última se queda: al acabar es cuando se lee el final.
              onAnimationEnd={() => !ultima && ir(false)}
            />
          </span>
        ))}
      </div>

      <button ref={boton} className="historias-cerrar" onClick={onCerrar} aria-label="Cerrar">
        ×
      </button>

      <div
        className="historias-toque"
        onPointerDown={() => {
          pulsado.current = Date.now();
          setParada(true);
        }}
        onPointerUp={alSoltar}
        onPointerCancel={() => setParada(false)}
        onPointerLeave={() => setParada(false)}
      >
        <div className="historia" key={historia.id} aria-live="polite">
          <span className="historia-emoji" aria-hidden="true">
            {historia.emoji}
          </span>
          <p className="historia-antes">{historia.antes}</p>
          <p className="historia-cifra">{historia.cifra}</p>
          {historia.despues && <p className="historia-despues">{historia.despues}</p>}
        </div>
      </div>

      {ultima && (
        <div className="historias-final">
          <button onClick={() => setActual(0)}>↺ Otra vez</button>
          <button className="historias-salir" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      )}

      <p className="historias-ayuda" aria-hidden="true">
        {esOrdenador() ? "Flechas para pasar · espacio para parar" : "Toca a los lados para pasar · mantén para parar"}
      </p>
    </div>,
    document.body
  );
}

export default Historias;
