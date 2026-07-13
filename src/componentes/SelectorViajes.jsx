// Elegir viaje, crear uno nuevo o borrar el de ahora.
function SelectorViajes({ viajes, viajeId, onCambiar, onCrear, onBorrar }) {
  return (
    <section className="tarjeta">
      <h2>🗺️ Viaje</h2>

      <div className="fila-formulario">
        <select value={viajeId} onChange={(e) => onCambiar(Number(e.target.value))}>
          {viajes.map((viaje) => (
            <option key={viaje.id} value={viaje.id}>
              {viaje.nombre}
            </option>
          ))}
        </select>

        <button onClick={onCrear}>Nuevo viaje</button>

        {/* El último viaje no se puede borrar, siempre queda uno. */}
        {viajes.length > 1 && (
          <button className="boton-quitar" onClick={onBorrar} title="Borrar este viaje">
            ✕
          </button>
        )}
      </div>
    </section>
  );
}

export default SelectorViajes;
