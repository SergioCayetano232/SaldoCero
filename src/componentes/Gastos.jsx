import { useState } from "react";
import { participantesDeGasto } from "../calculos";

function Gastos({ viajeros, gastos, onAnadir, onEditar, onQuitar }) {
  const [pagadorId, setPagadorId] = useState("");
  const [importe, setImporte] = useState("");
  const [concepto, setConcepto] = useState("");
  // Entre quiénes se reparte. Por defecto entre todos, que es lo normal.
  const [participantes, setParticipantes] = useState([]);
  // El gasto que estás tocando ahora mismo. Vacío si estás apuntando uno nuevo.
  const [editando, setEditando] = useState(null);

  const todosLosIds = viajeros.map((v) => v.id);
  // Si no hay nadie marcado a mano, van todos.
  const marcados = participantes.length > 0 ? participantes : todosLosIds;
  const entreTodos = marcados.length === viajeros.length;

  function alternar(id) {
    const nuevos = marcados.includes(id)
      ? marcados.filter((otro) => otro !== id)
      : [...marcados, id];

    setParticipantes(nuevos);
  }

  function limpiar() {
    setImporte("");
    setConcepto("");
    setParticipantes([]);
    setEditando(null);
  }

  // Subimos el gasto al formulario para poder cambiarlo.
  function editar(gasto) {
    setEditando(gasto.id);
    setPagadorId(gasto.pagadorId);
    setImporte(String(gasto.importe));
    setConcepto(gasto.concepto);
    setParticipantes(participantesDeGasto(gasto, viajeros).map((v) => v.id));
  }

  function guardar() {
    const importeNumero = parseFloat(importe);

    if (pagadorId === "") return;
    if (isNaN(importeNumero) || importeNumero <= 0) return;

    const gasto = {
      pagadorId,
      importe: importeNumero,
      concepto: concepto.trim() === "" ? "Gasto" : concepto.trim(),
      participantes: marcados,
    };

    if (editando) {
      onEditar(editando, gasto);
      // Terminada la edición, el formulario vuelve a estar en blanco.
      setPagadorId("");
    } else {
      // Dejamos el pagador puesto por si encadena varios gastos.
      onAnadir(gasto);
    }

    limpiar();
  }

  function cancelar() {
    setPagadorId("");
    limpiar();
  }

  function nombrePagador(id) {
    const viajero = viajeros.find((v) => v.id === id);
    return viajero ? viajero.nombre : "¿?";
  }

  // "cena · entre Ana y Luis", para saber de un vistazo cómo se repartió.
  function textoReparto(gasto) {
    const suyos = participantesDeGasto(gasto, viajeros);
    if (suyos.length === viajeros.length) return "entre todos";

    return `entre ${suyos.map((v) => v.nombre).join(", ")}`;
  }

  return (
    <section className="tarjeta">
      <h2>🧾 Gastos</h2>

      {viajeros.length === 0 ? (
        <p className="vacio">Primero añade viajeros para poder registrar gastos.</p>
      ) : (
        <>
          <div className="formulario-gasto">
            <select value={pagadorId} onChange={(e) => setPagadorId(e.target.value)}>
              <option value="">¿Quién pagó?</option>
              {viajeros.map((viajero) => (
                <option key={viajero.id} value={viajero.id}>
                  {viajero.nombre}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Importe (€)"
              min="0"
              step="0.01"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
            />

            <input
              type="text"
              placeholder="Concepto (cena, hotel...)"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") guardar();
              }}
            />

            <div className="participantes">
              <p className="participantes-titulo">
                Se reparte entre{" "}
                {entreTodos ? <strong>todos</strong> : <strong>{marcados.length}</strong>}
                {!entreTodos && (
                  <button className="enlace" onClick={() => setParticipantes(todosLosIds)}>
                    marcar todos
                  </button>
                )}
              </p>

              <div className="casillas">
                {viajeros.map((viajero) => (
                  <label key={viajero.id} className="casilla">
                    <input
                      type="checkbox"
                      checked={marcados.includes(viajero.id)}
                      onChange={() => alternar(viajero.id)}
                    />
                    {viajero.nombre}
                  </label>
                ))}
              </div>
            </div>

            {editando ? (
              <div className="fila-botones">
                <button onClick={guardar}>Guardar cambios</button>
                <button className="boton-cancelar" onClick={cancelar}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={guardar}>Añadir gasto</button>
            )}
          </div>

          {gastos.length === 0 ? (
            <p className="vacio">Todavía no hay gastos.</p>
          ) : (
            <ul className="lista">
              {gastos.map((gasto) => (
                <li key={gasto.id} className={gasto.id === editando ? "editandose" : ""}>
                  <span>
                    <strong>{nombrePagador(gasto.pagadorId)}</strong> pagó{" "}
                    {gasto.importe.toFixed(2)} € · {gasto.concepto}
                    <br />
                    <small className="reparto">{textoReparto(gasto)}</small>
                  </span>
                  <span className="acciones">
                    <button
                      className="boton-editar"
                      onClick={() => editar(gasto)}
                      title="Editar gasto"
                    >
                      ✏️
                    </button>
                    <button className="boton-quitar" onClick={() => onQuitar(gasto.id)}>
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export default Gastos;
