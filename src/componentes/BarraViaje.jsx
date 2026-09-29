import { lazy, Suspense, useCallback, useState } from "react";
import { copiarAlPortapapeles, enlaceDelViaje, invitacion, invitar } from "../compartir";

// La librería del QR pesa, y casi nadie lo abre: se baja solo al pulsar.
const QRViaje = lazy(() => import("./QRViaje"));

// Lo que dice cada botón según lo que haya pasado al pulsarlo.
const TEXTO_INVITAR = {
  copiado: "¡Enlace copiado!",
  fallo: "No se pudo",
};

// El viaje abierto, con su código para compartir.
function BarraViaje({ viaje, onSalir }) {
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [invitado, setInvitado] = useState("");
  const [conQR, setConQR] = useState(false);
  // Siempre la misma: si cambiara, la ventana robaría el foco en cada refresco.
  const cerrarQR = useCallback(() => setConQR(false), []);

  async function copiarCodigo() {
    const hecho = await copiarAlPortapapeles(viaje.codigo);
    if (!hecho) return;

    setCodigoCopiado(true);
    setTimeout(() => setCodigoCopiado(false), 2000);
  }

  async function alInvitar() {
    const como = await invitar(invitacion(viaje));
    // Si ha salido el menú del móvil, ya se ha visto lo que pasaba: nada que decir.
    if (!TEXTO_INVITAR[como]) return;

    setInvitado(como);
    setTimeout(() => setInvitado(""), 2500);
  }

  return (
    <section className="tarjeta tarjeta-viaje">
      <div className="viaje-titulo">
        <span className="viaje-emoji">🗺️</span>
        <h2 className="viaje-nombre">{viaje.nombre}</h2>
        <span className="viaje-moneda">{viaje.moneda ?? "EUR"}</span>
        <button className="boton-salir" onClick={onSalir} title="Salir del viaje">
          ✕
        </button>
      </div>

      <div className="fila-formulario">
        <button
          className={`codigo ${codigoCopiado ? "copiado" : ""}`}
          onClick={copiarCodigo}
          title="Copiar el código"
        >
          {codigoCopiado ? "¡Copiado!" : viaje.codigo}
        </button>
        <button className="boton-invitar" onClick={alInvitar}>
          <span className="invitar-icono" aria-hidden="true">
            ↗
          </span>
          {TEXTO_INVITAR[invitado] ?? "Invitar"}
        </button>
        <button className="boton-qr" onClick={() => setConQR(true)} title="Enseñar el QR">
          <span aria-hidden="true">▦</span> QR
        </button>
      </div>

      <p className="vacio aviso-codigo">
        Invítalos con el enlace, o pásales el código y entran a este mismo viaje.
        Guárdalo tú también: es la única forma de volver desde otro móvil.
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
