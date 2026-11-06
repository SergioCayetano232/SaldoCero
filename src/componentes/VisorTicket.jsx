import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { urlParaBajar } from "../tickets";
import { t } from "../idioma";

// La foto del ticket a pantalla completa. Se cierra con la X, con Escape o
// tocando fuera. Va en el body: dentro de una tarjeta, su backdrop-filter hace
// que el position fixed se mida contra la tarjeta y no contra la pantalla.
function VisorTicket({ ruta, concepto, cargar, onCerrar }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");
  // La dirección llega antes que la foto: hasta que no está entera, el aviso.
  const [cargada, setCargada] = useState(false);

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
    <div className="visor-ticket" role="dialog" aria-modal="true" aria-label={t("Ticket de {concepto}", { concepto })} onClick={onCerrar}>
      <div className="visor-caja" onClick={(e) => e.stopPropagation()}>
        <div className="visor-cabecera">
          <span>🧾 {concepto}</span>
          {cargada && (
            <a className="visor-bajar" href={urlParaBajar(url, concepto)} title={t("Descargar la foto")} aria-label={t("Descargar la foto")}>
              ↓
            </a>
          )}
          <button className="visor-cerrar" onClick={onCerrar} aria-label={t("Cerrar")} autoFocus>
            ✕
          </button>
        </div>

        {error ? (
          <p className="error">{error}</p>
        ) : (
          <>
            {!cargada && <p className="visor-cargando">{t("Cargando la foto…")}</p>}
            {url && (
              <img
                src={url}
                alt={t("Ticket de {concepto}", { concepto })}
                decoding="async"
                className={cargada ? "" : "sin-cargar"}
                onLoad={() => setCargada(true)}
                onError={() => setError(t("No hemos podido bajar la foto. Revisa tu conexión."))}
              />
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

export default VisorTicket;
