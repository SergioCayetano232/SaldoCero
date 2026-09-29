import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { qrDelEnlace } from "../qr";

// El margen blanco alrededor. Sin él, muchas cámaras no lo encuentran.
const MARGEN = 4;

function QRViaje({ enlace, codigo, nombre, onCerrar }) {
  const qr = useMemo(() => qrDelEnlace(enlace), [enlace]);
  const cerrar = useRef(null);

  useEffect(() => {
    cerrar.current?.focus();

    function alPulsar(e) {
      if (e.key === "Escape") onCerrar();
    }

    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [onCerrar]);

  const lado = qr.tamano + MARGEN * 2;

  // Al body: dentro de la tarjeta, su backdrop-filter encierra el position fixed
  // y la ventana sale cortada dentro de ella.
  return createPortal(
    <div className="velo" onClick={onCerrar}>
      <div
        className="ventana-qr"
        role="dialog"
        aria-modal="true"
        aria-label={`Código QR para entrar en ${nombre}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="boton-salir ventana-cerrar" onClick={onCerrar} ref={cerrar} title="Cerrar">
          ✕
        </button>

        <h3 className="ventana-titulo">Entra en {nombre}</h3>

        <svg className="qr" viewBox={`${-MARGEN} ${-MARGEN} ${lado} ${lado}`} shapeRendering="crispEdges">
          <rect x={-MARGEN} y={-MARGEN} width={lado} height={lado} className="qr-fondo" />
          <path d={qr.camino} className="qr-puntos" />
        </svg>

        <p className="qr-codigo">{codigo}</p>
        <p className="vacio">Que lo apunten con la cámara del móvil y entran directos.</p>
      </div>
    </div>,
    document.body
  );
}

export default QRViaje;
