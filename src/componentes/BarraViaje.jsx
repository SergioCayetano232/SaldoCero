import { useState } from "react";

// El viaje abierto, con su código para compartir.
function BarraViaje({ viaje, onSalir }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(viaje.codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
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
        <span className="codigo" onClick={copiar} title="Copiar">
          {viaje.codigo}
        </span>
        <button onClick={copiar}>{copiado ? "¡Copiado!" : "Copiar código"}</button>
      </div>

      <p className="vacio aviso-codigo">
        Pásales el código y entran a este mismo viaje. Guárdalo tú también: es la
        única forma de volver desde otro móvil.
      </p>
    </section>
  );
}

export default BarraViaje;
