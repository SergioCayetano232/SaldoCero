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
    <section className="tarjeta">
      <h2>🗺️ {viaje.nombre}</h2>

      <div className="fila-formulario">
        <span className="codigo" onClick={copiar} title="Copiar">
          {viaje.codigo}
        </span>
        <button onClick={copiar}>{copiado ? "¡Copiado!" : "Copiar código"}</button>
        <button className="boton-quitar" onClick={onSalir} title="Salir del viaje">
          ✕
        </button>
      </div>

      <p className="vacio">Pásales el código y entran a este mismo viaje.</p>
    </section>
  );
}

export default BarraViaje;
