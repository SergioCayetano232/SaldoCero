import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { copiarAlPortapapeles, enlaceDelViaje, invitacion, invitacionParaMirar, invitar } from "../compartir";
import NombreEditable from "./NombreEditable";
import { textoCerrado } from "../cerrar";
import { textoDuracion } from "../duracion";
import { hoy } from "../fechas";
import { esAtajoCopiarCodigo, esAtajoInvitar, esAtajoSalir, esOrdenador } from "../teclado";
import { t } from "../idioma";
import { MONEDAS, monedaConBandera } from "../monedas";
import { puedeCambiarMoneda, monedaNueva } from "../cambiarMoneda";

// La librería del QR pesa, y casi nadie lo abre: se baja solo al pulsar.
const QRViaje = lazy(() => import("./QRViaje"));

// Lo que dice cada botón según lo que haya pasado al pulsarlo.
const TEXTO_INVITAR = {
  copiado: "¡Enlace copiado!",
  fallo: "No se pudo",
};

// El viaje abierto, con su código para compartir.
// Con soloVer se entró con el código de mirar: se ve todo, no se toca nada.
function BarraViaje({ viaje, cerrado, soloVer = false, onSalir, onRenombrar, onReabrir, onCambiarMoneda, onCodigoParaVer, discreto = false, onDiscreto }) {
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [invitado, setInvitado] = useState("");
  const [paraMirar, setParaMirar] = useState("");
  const fijo = cerrado || soloVer;
  const [conQR, setConQR] = useState(false);
  // Siempre la misma: si cambiara, la ventana robaría el foco en cada refresco.
  const cerrarQR = useCallback(() => setConQR(false), []);
  const duracion = textoDuracion(viaje.gastos ?? [], hoy(), cerrado);

  useEffect(() => {
    function alPulsar(e) {
      if (!esAtajoInvitar(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      setConQR(true);
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  useEffect(() => {
    function alPulsar(e) {
      if (!esAtajoSalir(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      onSalir();
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [onSalir]);

  // Sin dependencias, como la R: copiarCodigo() es nueva en cada render.
  useEffect(() => {
    function alPulsar(e) {
      if (!esAtajoCopiarCodigo(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      copiarCodigo();
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  });

  async function copiarCodigo() {
    const hecho = await copiarAlPortapapeles(viaje.codigo);
    if (!hecho) return;

    setCodigoCopiado(true);
    setTimeout(() => setCodigoCopiado(false), 2000);
  }

  async function alInvitar() {
    const como = await invitar(soloVer ? invitacionParaMirar(viaje) : invitacion(viaje));
    // Si ha salido el menú del móvil, ya se ha visto lo que pasaba: nada que decir.
    if (!TEXTO_INVITAR[como]) return;

    setInvitado(como);
    setTimeout(() => setInvitado(""), 2500);
  }

  // El código de mirar no lo tenemos: se le pide a la base de datos al pulsar.
  async function invitarAMirar() {
    let como;
    try {
      como = await invitar(invitacionParaMirar({ nombre: viaje.nombre, codigo: await onCodigoParaVer() }));
    } catch {
      como = "fallo";
    }
    if (!TEXTO_INVITAR[como]) return;

    setParaMirar(como);
    setTimeout(() => setParaMirar(""), 2500);
  }

  return (
    <section className="tarjeta tarjeta-viaje">
      <div className="viaje-titulo">
        <span className="viaje-emoji">🗺️</span>
        {fijo ? (
          <h2 className="viaje-nombre">{viaje.nombre}</h2>
        ) : (
          <NombreEditable
            como="h2"
            className="viaje-nombre"
            nombre={viaje.nombre}
            onGuardar={onRenombrar}
            titulo={t("Cambiar el nombre del viaje")}
          />
        )}
        {duracion && <span className="viaje-dia">{duracion}</span>}
        {!fijo && puedeCambiarMoneda(viaje) ? (
          // El select va encima, transparente: así se ve la pastilla y al tocarla sale la lista.
          <label className="viaje-moneda cambiar-moneda" title={t("Cambiar la moneda del viaje")}>
            {viaje.moneda ?? "EUR"}
            <span aria-hidden="true"> ▾</span>
            <select
              value={viaje.moneda ?? "EUR"}
              onChange={(e) => {
                const nueva = monedaNueva(e.target.value, viaje.moneda ?? "EUR");
                if (nueva) onCambiarMoneda(nueva);
              }}
              aria-label={t("Cambiar la moneda del viaje")}
            >
              {MONEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {monedaConBandera(m.codigo)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span
            className="viaje-moneda"
            title={fijo ? undefined : t("Con gastos o bote apuntados ya no se cambia la moneda")}
          >
            {viaje.moneda ?? "EUR"}
          </span>
        )}
        {onDiscreto && (
          <button
            className={`boton-discreto ${discreto ? "puesto" : ""}`}
            onClick={onDiscreto}
            aria-pressed={discreto}
            title={discreto ? t("Enseñar las cifras") : t("Tapar las cifras")}
          >
            <span aria-hidden="true">{discreto ? "🙈" : "👁️"}</span>
          </button>
        )}
        <button
          className="boton-salir"
          onClick={onSalir}
          title={esOrdenador() ? t("Salir del viaje (también con la Q)") : t("Salir del viaje")}
          aria-keyshortcuts="q"
        >
          ✕
        </button>
      </div>

      {cerrado && (
        <div className="viaje-cerrado">
          <span className="viaje-cerrado-icono" aria-hidden="true">
            🔒
          </span>
          <p>
            <strong>{textoCerrado(viaje.cerradoEn)}.</strong>{" "}
            {t("Los gastos ya no cambian; las deudas se pueden seguir marcando como pagadas.")}
          </p>
          {!soloVer && (
            <button className="enlace" onClick={onReabrir}>
              {t("Reabrir")}
            </button>
          )}
        </div>
      )}

      {soloVer && (
        <div className="viaje-cerrado viaje-solo-ver">
          <span className="viaje-cerrado-icono" aria-hidden="true">
            👁️
          </span>
          <p>
            <strong>{t("Solo para mirar.")}</strong> {t("Ves las cuentas como van, pero no puedes cambiar nada.")}
          </p>
        </div>
      )}

      <div className="fila-formulario">
        <button
          className={`codigo ${codigoCopiado ? "copiado" : ""}`}
          onClick={copiarCodigo}
          title={esOrdenador() ? t("Copiar el código (o pulsa K)") : t("Copiar el código")}
          aria-keyshortcuts="K"
        >
          {codigoCopiado ? t("¡Copiado!") : viaje.codigo}
        </button>
        <button className="boton-invitar" onClick={alInvitar}>
          <span className="invitar-icono" aria-hidden="true">
            ↗
          </span>
          {t(TEXTO_INVITAR[invitado] ?? "Invitar")}
        </button>
        <button className="boton-qr" onClick={() => setConQR(true)} title={t("Enseñar el QR")} aria-keyshortcuts="i">
          <span aria-hidden="true">▦</span> QR
        </button>
      </div>

      <p className="vacio aviso-codigo">
        {soloVer
          ? t("Este código es para mirar. Si se lo pasas a alguien, tampoco podrá cambiar nada.")
          : t("Invítalos con el enlace, o pásales el código y entran a este mismo viaje. Guárdalo tú también: es la única forma de volver desde otro móvil.")}
        {!soloVer && (
          <>
            {" "}
            <button className="enlace invitar-a-mirar" onClick={invitarAMirar}>
              {paraMirar ? t(TEXTO_INVITAR[paraMirar]) : `👁️ ${t("¿Alguien que solo quiera mirar?")}`}
            </button>
          </>
        )}
      </p>

      {conQR && (
        <Suspense fallback={null}>
          <QRViaje
            enlace={enlaceDelViaje(viaje.codigo)}
            codigo={viaje.codigo}
            nombre={viaje.nombre}
            onCerrar={cerrarQR}
          />
        </Suspense>
      )}
    </section>
  );
}

export default BarraViaje;
