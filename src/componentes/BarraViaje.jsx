import { useState } from "react";
import { copiarAlPortapapeles, invitacion, invitar } from "../compartir";

// Lo que dice cada botón según lo que haya pasado al pulsarlo.
const TEXTO_INVITAR = {
  copiado: "¡Enlace copiado!",
  fallo: "No se pudo",
};

// El viaje abierto, con su código para compartir.
function BarraViaje({ viaje, onSalir }) {
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [invitado, setInvitado] = useState("");

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
      </div>

      <p className="vacio aviso-codigo">
        Invítalos con el enlace, o pásales el código y entran a este mismo viaje.
        Guárdalo tú también: es la única forma de volver desde otro móvil.
      </p>
    </section>
  );
}

export default BarraViaje;
