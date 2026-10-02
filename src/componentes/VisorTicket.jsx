import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// La foto del ticket a pantalla completa. Se cierra con la X, con Escape o
// tocando fuera. Va en el body: dentro de una tarjeta, su backdrop-filter hace
// que el position fixed se mida contra la tarjeta y no contra la pantalla.
function VisorTicket({ ruta, concepto, cargar, onCerrar }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;

    cargar(ruta)
      .then((u) => vigente && setUrl(u))
      .catch((fallo) => vigente && setError(fallo.message));

    return () => {
      vigente = false;
    };
  }, [ruta, cargar]);

  useEffect(() => {
    function alPulsar(e) {
      if (e.key === "Escape") onCerrar();
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [onCerrar]);

  return createPortal(
    <div className="visor-ticket" role="dialog" aria-modal="true" aria-label={`Ticket de ${concepto}`} onClick={onCerrar}>
      <div className="visor-caja" onClick={(e) => e.stopPropagation()}>
        <div className="visor-cabecera">
          <span>🧾 {concepto}</span>
          <button className="visor-cerrar" onClick={onCerrar} aria-label="Cerrar" autoFocus>
            ✕
          </button>
        </div>

        {error ? (
          <p className="error">{error}</p>
        ) : url ? (
          <img src={url} alt={`Ticket de ${concepto}`} />
        ) : (
          <p className="visor-cargando">Cargando la foto…</p>
        )}
      </div>
    </div>,
    document.body
  );
}

export default VisorTicket;
