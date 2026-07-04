import { useState } from "react";
import "./App.css";

function App() {
  // --- Viajeros ---
  const [viajeros, setViajeros] = useState([]);
  const [nombre, setNombre] = useState("");

  // --- Gastos ---
  const [gastos, setGastos] = useState([]);
  const [pagadorId, setPagadorId] = useState(""); // quién pagó (id del viajero)
  const [importe, setImporte] = useState(""); // cuánto
  const [concepto, setConcepto] = useState(""); // en qué

  function anadirViajero() {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio === "") return;

    const nuevoViajero = { id: Date.now(), nombre: nombreLimpio };
    setViajeros([...viajeros, nuevoViajero]);
    setNombre("");
  }

  function quitarViajero(id) {
    setViajeros(viajeros.filter((viajero) => viajero.id !== id));
    // También borramos los gastos que hubiera pagado esa persona.
    setGastos(gastos.filter((gasto) => gasto.pagadorId !== id));
  }

  // Añade un gasto nuevo.
  function anadirGasto() {
    const importeNumero = parseFloat(importe);

    // Comprobaciones antes de añadir:
    if (pagadorId === "") return; // hay que elegir quién pagó
    if (isNaN(importeNumero) || importeNumero <= 0) return; // importe válido y mayor que 0

    const nuevoGasto = {
      id: Date.now(),
      pagadorId: Number(pagadorId), // lo guardamos como número
      importe: importeNumero,
      concepto: concepto.trim() === "" ? "Gasto" : concepto.trim(),
    };

    setGastos([...gastos, nuevoGasto]);
    // Limpiamos el formulario (menos el pagador, por comodidad si repite)
    setImporte("");
    setConcepto("");
  }

  function quitarGasto(id) {
    setGastos(gastos.filter((gasto) => gasto.id !== id));
  }

  // Busca el nombre de un viajero a partir de su id (para mostrarlo en la lista).
  function nombrePagador(id) {
    const viajero = viajeros.find((v) => v.id === id);
    return viajero ? viajero.nombre : "¿?";
  }

  return (
    <div className="app">
      <h1>SaldoCero</h1>
      <p>Repartimos los gastos del viaje entre todos.</p>

      {/* ---------- VIAJEROS ---------- */}
      <section className="tarjeta">
        <h2>Viajeros</h2>

        <div className="fila-formulario">
          <input
            type="text"
            placeholder="Nombre del viajero"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") anadirViajero();
            }}
          />
          <button onClick={anadirViajero}>Añadir</button>
        </div>

        {viajeros.length === 0 ? (
          <p className="vacio">
            Aún no hay viajeros. Añade al menos dos para empezar.
          </p>
        ) : (
          <ul className="lista">
            {viajeros.map((viajero) => (
              <li key={viajero.id}>
                <span>{viajero.nombre}</span>
                <button
                  className="boton-quitar"
                  onClick={() => quitarViajero(viajero.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- GASTOS ---------- */}
      <section className="tarjeta">
        <h2>Gastos</h2>

        {viajeros.length === 0 ? (
          <p className="vacio">
            Primero añade viajeros para poder registrar gastos.
          </p>
        ) : (
          <>
            <div className="formulario-gasto">
              <select
                value={pagadorId}
                onChange={(e) => setPagadorId(e.target.value)}
              >
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
                  if (e.key === "Enter") anadirGasto();
                }}
              />

              <button onClick={anadirGasto}>Añadir gasto</button>
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
                    </span>
                    <button
                      className="boton-quitar"
                      onClick={() => quitarGasto(gasto.id)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default App;