import { useState } from "react";
import { participantesDeGasto } from "../calculos";

function Gastos({ viajeros, gastos, onAnadir, onQuitar }) {
  const [pagadorId, setPagadorId] = useState("");
  const [importe, setImporte] = useState("");
  const [concepto, setConcepto] = useState("");
  // Entre quiénes se reparte. Por defecto entre todos, que es lo normal.
  const [participantes, setParticipantes] = useState([]);

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

  function anadir() {
    const importeNumero = parseFloat(importe);

    if (pagadorId === "") return;
    if (isNaN(importeNumero) || importeNumero <= 0) return;
    if (marcados.length === 0) return; // con quién lo repartimos, entonces

    onAnadir({
      pagadorId: Number(pagadorId),
      importe: importeNumero,
      concepto: concepto.trim() === "" ? "Gasto" : concepto.trim(),
      participantes: marcados,
    });

    // Dejamos el pagador puesto por si encadena varios gastos.
    setImporte("");
    setConcepto("");
    setParticipantes([]);
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
                if (e.key === "Enter") anadir();
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

            <button onClick={anadir}>Añadir gasto</button>
          </div>

          {gastos.length === 0 ? (
            <p className="vacio">Todavía no hay gastos.</p>
          ) : (
            <ul className="lista">
              {gastos.map((gasto) => (
                <li key={gasto.id}>
                  <span>
                    <strong>{nombrePagador(gasto.pagadorId)}</strong> pagó{" "}
                    {gasto.importe.toFixed(2)} € · {gasto.concepto}
                    <br />
                    <small className="reparto">{textoReparto(gasto)}</small>
                  </span>
                  <button className="boton-quitar" onClick={() => onQuitar(gasto.id)}>
                    ✕
                  </button>
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
