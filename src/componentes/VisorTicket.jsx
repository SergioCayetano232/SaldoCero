import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { urlParaBajar, esImagen } from "../tickets";
import { t } from "../idioma";

// Las fotos del ticket a pantalla completa. Se cierra con la X, con Escape o
// tocando fuera. Va en el body: dentro de una tarjeta, su backdrop-filter hace
// que el position fixed se mida contra la tarjeta y no contra la pantalla.
// Sin onAnadir ni onQuitar es solo para mirar.
function VisorTicket({ rutas, concepto, cargar, onCerrar, onAnadir, onQuitar }) {
  const [cual, setCual] = useState(0);
  // Si quitan la última que estabas viendo, a la de antes.
  const indice = Math.min(cual, rutas.length - 1);
  const ruta = rutas[indice];
  // Cada cosa con la foto de la que es: al pasar a otra, lo de la anterior no vale.
  const [direccion, setDireccion] = useState({ ruta: null, url: null, error: "" });
  const url = direccion.ruta === ruta ? direccion.url : null;
  const error = direccion.ruta === ruta ? direccion.error : "";
  // La direccion llega antes que la foto: hasta que no está entera, el aviso.
  const [cargadaLa, setCargadaLa] = useState(null);
  const cargada = cargadaLa === ruta;
  const [subiendo, setSubiendo] = useState(false);
  const varias = rutas.length > 1;

  useEffect(() => {
    let vigente = true;

    cargar(ruta)
      .then((u) => vigente && setDireccion({ ruta, url: u, error: "" }))
      .catch((fallo) => vigente && setDireccion({ ruta, url: null, error: fallo.message }));

    return () => {
      vigente = false;
    };
  }, [ruta, cargar]);

  useEffect(() => {
    function alPulsar(e) {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowRight") setCual((c) => Math.min(c + 1, rutas.length - 1));
      if (e.key === "ArrowLeft") setCual((c) => Math.max(c - 1, 0));
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [onCerrar, rutas.length]);

  async function anadir(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!esImagen(archivo)) return;

    setSubiendo(true);
    const bien = await onAnadir(archivo);
    setSubiendo(false);
    // Que se vea la que acabas de poner.
    if (bien) setCual(rutas.length);
  }

  async function quitar() {
    if (!window.confirm(t("¿Quitar esta foto?"))) return;
    if ((await onQuitar(ruta)) && rutas.length === 1) onCerrar();
  }

  return createPortal(
    <div className="visor-ticket" role="dialog" aria-modal="true" aria-label={t("Ticket de {concepto}", { concepto })} onClick={onCerrar}>
      <div className="visor-caja" onClick={(e) => e.stopPropagation()}>
        <div className="visor-cabecera">
          <span>
            🧾 {concepto}
            {varias && <span className="visor-cuenta"> · {indice + 1}/{rutas.length}</span>}
          </span>
          {cargada && (
            <a className="visor-bajar" href={urlParaBajar(url, concepto)} title={t("Descargar la foto")} aria-label={t("Descargar la foto")}>
              ↓
            </a>
          )}
          <button className="visor-cerrar" onClick={onCerrar} aria-label={t("Cerrar")} autoFocus>
            ✕
          </button>
        </div>

        <div className="visor-foto">
          {error ? (
            <p className="error">{error}</p>
          ) : (
            <>
              {!cargada && <p className="visor-cargando">{t("Cargando la foto…")}</p>}
              {url && (
                <img
                  key={ruta}
                  src={url}
                  alt={t("Ticket de {concepto}", { concepto })}
                  decoding="async"
                  className={cargada ? "" : "sin-cargar"}
                  onLoad={() => setCargadaLa(ruta)}
                  onError={() => setDireccion({ ruta, url: null, error: t("No hemos podido bajar la foto. Revisa tu conexión.") })}
                />
              )}
            </>
          )}

          {varias && indice > 0 && (
            <button className="visor-flecha visor-anterior" onClick={() => setCual(indice - 1)} aria-label={t("Foto anterior")}>
              ‹
            </button>
          )}
          {varias && indice < rutas.length - 1 && (
            <button className="visor-flecha visor-siguiente" onClick={() => setCual(indice + 1)} aria-label={t("Foto siguiente")}>
              ›
            </button>
          )}
        </div>

        {(onAnadir || onQuitar) && (
          <div className="visor-pie">
            {onAnadir && (
              <label className={`boton-foto ${subiendo ? "subiendo" : ""}`}>
                {subiendo ? t("Subiendo…") : `📷 ${t("Otra foto")}`}
                <input type="file" accept="image/*" onChange={anadir} disabled={subiendo} hidden />
              </label>
            )}
            {onQuitar && (
              <button className="enlace visor-quitar" onClick={quitar}>
                {t("Quitar esta")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default VisorTicket;
