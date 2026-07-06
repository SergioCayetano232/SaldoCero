import { useState, useEffect } from "react";
import "./App.css";

function App() {
  // --- Viajeros ---
  // Al arrancar, intentamos cargar los viajeros guardados en el navegador.
  const [viajeros, setViajeros] = useState(() => {
    try {
      const guardado = localStorage.getItem("saldocero-viajeros");
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });
  const [nombre, setNombre] = useState("");

  // --- Gastos ---
  // Igual con los gastos.
  const [gastos, setGastos] = useState(() => {
    try {
      const guardado = localStorage.getItem("saldocero-gastos");
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });
  const [pagadorId, setPagadorId] = useState(""); // quién pagó (id del viajero)
  const [importe, setImporte] = useState(""); // cuánto
  const [concepto, setConcepto] = useState(""); // en qué

  // Cada vez que cambian los viajeros, los guardamos en el navegador.
  useEffect(() => {
    localStorage.setItem("saldocero-viajeros", JSON.stringify(viajeros));
  }, [viajeros]);

  // Cada vez que cambian los gastos, los guardamos.
  useEffect(() => {
    localStorage.setItem("saldocero-gastos", JSON.stringify(gastos));
  }, [gastos]);

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

  // Borra todo para empezar un viaje nuevo (pide confirmación antes).
  function empezarDeCero() {
    const confirmado = window.confirm(
      "¿Seguro que quieres empezar de cero? Se borrarán todos los viajeros y gastos."
    );
    if (!confirmado) return; // si dice que no, no hacemos nada

    setViajeros([]);
    setGastos([]);
  }

  // Busca el nombre de un viajero a partir de su id (para mostrarlo en la lista).
  function nombrePagador(id) {
    const viajero = viajeros.find((v) => v.id === id);
    return viajero ? viajero.nombre : "¿?";
  }

  // --- CÁLCULOS ---
  // Se recalculan solos en cada render, a partir de viajeros y gastos.

  // Total gastado en el viaje.
  const total = gastos.reduce((suma, gasto) => suma + gasto.importe, 0);

  // Parte que le corresponde a cada persona (a partes iguales).
  const partePorPersona = viajeros.length > 0 ? total / viajeros.length : 0;

  // Para cada viajero calculamos cuánto ha puesto y su balance.
  const balances = viajeros.map((viajero) => {
    // Sumamos los gastos que pagó esta persona.
    const puesto = gastos
      .filter((gasto) => gasto.pagadorId === viajero.id)
      .reduce((suma, gasto) => suma + gasto.importe, 0);

    // Balance = lo que ha puesto menos lo que le tocaba.
    // Positivo -> le deben. Negativo -> debe.
    const balance = puesto - partePorPersona;

    return { ...viajero, puesto, balance };
  });

  // --- LE TOCA PAGAR A ---
  // La persona con el balance más bajo (la que menos ha aportado).
  let leTocaPagar = null; // null significa "no hay a quién señalar todavía"

  if (balances.length > 0) {
    const balanceMin = Math.min(...balances.map((v) => v.balance));
    const balanceMax = Math.max(...balances.map((v) => v.balance));

    // Si la diferencia entre el que más y el que menos ha puesto es mínima,
    // está todo igualado y puede pagar cualquiera.
    if (balanceMax - balanceMin < 0.01) {
      leTocaPagar = { igualados: true };
    } else {
      // Buscamos a la persona que tiene ese balance más bajo.
      const persona = balances.find((v) => v.balance === balanceMin);
      leTocaPagar = { igualados: false, nombre: persona.nombre };
    }
  }

  // --- SALDAR CUENTAS ---
  // Calculamos quién paga a quién para dejar a todos a cero.
  function calcularPagos() {
    // Separamos en dos grupos y trabajamos con COPIAS para no tocar los balances.
    // deudores: los que deben (balance negativo) -> guardamos cuánto deben (en positivo).
    const deudores = balances
      .filter((v) => v.balance < -0.01)
      .map((v) => ({ nombre: v.nombre, cantidad: -v.balance }))
      .sort((a, b) => b.cantidad - a.cantidad); // de mayor a menor deuda

    // acreedores: a los que les deben (balance positivo).
    const acreedores = balances
      .filter((v) => v.balance > 0.01)
      .map((v) => ({ nombre: v.nombre, cantidad: v.balance }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const pagos = [];
    let i = 0; // índice del deudor actual
    let j = 0; // índice del acreedor actual

    while (i < deudores.length && j < acreedores.length) {
      // El pago es el menor de lo que uno debe y lo que al otro le deben.
      const cantidad = Math.min(deudores[i].cantidad, acreedores[j].cantidad);

      pagos.push({
        de: deudores[i].nombre,
        a: acreedores[j].nombre,
        cantidad: cantidad,
      });

      // Restamos lo pagado a ambos.
      deudores[i].cantidad -= cantidad;
      acreedores[j].cantidad -= cantidad;

      // Si un deudor ya no debe nada, pasamos al siguiente. Igual con acreedores.
      if (deudores[i].cantidad < 0.01) i++;
      if (acreedores[j].cantidad < 0.01) j++;
    }

    return pagos;
  }

  const pagos = calcularPagos();

  return (
    <div className="app">
      <header className="cabecera">
        <h1>Saldo<span>Cero</span></h1>
        <p>Repartimos los gastos del viaje entre todos.</p>
      </header>

      {/* ---------- VIAJEROS ---------- */}
      <section className="tarjeta">
        <h2>🧳 Viajeros</h2>

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
        <h2>🧾 Gastos</h2>

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

      {/* ---------- RESUMEN ---------- */}
      {gastos.length > 0 && (
        <section className="tarjeta">
          <h2>📊 Resumen</h2>

          <p className="resumen-totales">
            Total gastado: <strong>{total.toFixed(2)} €</strong>
            <br />
            Por persona: <strong>{partePorPersona.toFixed(2)} €</strong>
          </p>

          {leTocaPagar && (
            <div className="le-toca">
              {leTocaPagar.igualados ? (
                <>✅ Está todo igualado, puede pagar cualquiera.</>
              ) : (
                <>
                  👉 Le toca pagar a <strong>{leTocaPagar.nombre}</strong>
                </>
              )}
            </div>
          )}

          <ul className="lista">
            {balances.map((viajero) => (
              <li key={viajero.id} className="fila-balance">
                <span>
                  <strong>{viajero.nombre}</strong> ha puesto{" "}
                  {viajero.puesto.toFixed(2)} €
                </span>
                <span className={viajero.balance >= 0 ? "positivo" : "negativo"}>
                  {viajero.balance >= 0 ? "le deben " : "debe "}
                  {Math.abs(viajero.balance).toFixed(2)} €
                </span>
              </li>
            ))}
          </ul>

          {/* Cómo saldar las cuentas */}
          <div className="saldar">
            <h3>Cómo saldar cuentas</h3>
            {pagos.length === 0 ? (
              <p className="vacio">
                Cuentas saldadas. Nadie debe nada. 🎉
              </p>
            ) : (
              <ul className="lista">
                {pagos.map((pago, indice) => (
                  <li key={indice}>
                    <span>
                      <strong>{pago.de}</strong> paga{" "}
                      {pago.cantidad.toFixed(2)} € a <strong>{pago.a}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Botón para reiniciar todo */}
      {(viajeros.length > 0 || gastos.length > 0) && (
        <button className="boton-reiniciar" onClick={empezarDeCero}>
          Empezar de cero
        </button>
      )}
    </div>
  );
}

export default App;