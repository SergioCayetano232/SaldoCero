import { useState, useEffect } from "react";
import "./App.css";
import { cargarViajes, guardarViajes, nuevoId, viajeVacio } from "./almacenamiento";
import { calcularBalances } from "./calculos";
import SelectorViajes from "./componentes/SelectorViajes";
import Viajeros from "./componentes/Viajeros";
import Gastos from "./componentes/Gastos";
import Resumen from "./componentes/Resumen";

function App() {
  const [viajes, setViajes] = useState(cargarViajes);
  // Abrimos el primero, que es donde estaba el usuario la última vez.
  const [viajeId, setViajeId] = useState(() => viajes[0].id);

  useEffect(() => {
    guardarViajes(viajes);
  }, [viajes]);

  const viaje = viajes.find((v) => v.id === viajeId) ?? viajes[0];
  const { viajeros, gastos } = viaje;

  // Toca solo el viaje abierto y deja los demás como estaban.
  function cambiarViaje(cambios) {
    setViajes(viajes.map((v) => (v.id === viaje.id ? { ...v, ...cambios } : v)));
  }

  function crearViaje() {
    const nombre = window.prompt("¿Cómo se llama el viaje?", "Viaje nuevo");
    if (nombre === null) return;

    const viajeNuevo = viajeVacio(nombre.trim() || "Viaje nuevo");
    setViajes([...viajes, viajeNuevo]);
    setViajeId(viajeNuevo.id);
  }

  function borrarViaje() {
    const confirmado = window.confirm(
      `¿Seguro que quieres borrar "${viaje.nombre}"? Se pierden sus viajeros y gastos.`
    );
    if (!confirmado) return;

    const quedan = viajes.filter((v) => v.id !== viaje.id);
    setViajes(quedan);
    setViajeId(quedan[0].id);
  }

  function anadirViajero(nombre) {
    cambiarViaje({ viajeros: [...viajeros, { id: nuevoId(), nombre }] });
  }

  function quitarViajero(id) {
    cambiarViaje({
      viajeros: viajeros.filter((viajero) => viajero.id !== id),
      gastos: gastos
        // Fuera los gastos que pagó.
        .filter((gasto) => gasto.pagadorId !== id)
        // Y que no siga repartiendo los de los demás.
        .map((gasto) =>
          gasto.participantes
            ? { ...gasto, participantes: gasto.participantes.filter((p) => p !== id) }
            : gasto
        ),
    });
  }

  function anadirGasto(gasto) {
    cambiarViaje({ gastos: [...gastos, { id: nuevoId(), ...gasto }] });
  }

  function quitarGasto(id) {
    cambiarViaje({ gastos: gastos.filter((gasto) => gasto.id !== id) });
  }

  function empezarDeCero() {
    const confirmado = window.confirm(
      "¿Seguro que quieres vaciar este viaje? Se borrarán sus viajeros y gastos."
    );
    if (!confirmado) return;

    cambiarViaje({ viajeros: [], gastos: [] });
  }

  const balances = calcularBalances(viajeros, gastos);

  return (
    <div className="app">
      <header className="cabecera">
        <h1>
          Saldo<span>Cero</span>
        </h1>
        <p>Repartimos los gastos del viaje entre todos.</p>
      </header>

      <SelectorViajes
        viajes={viajes}
        viajeId={viaje.id}
        onCambiar={setViajeId}
        onCrear={crearViaje}
        onBorrar={borrarViaje}
      />

      <Viajeros viajeros={viajeros} onAnadir={anadirViajero} onQuitar={quitarViajero} />

      <Gastos
        viajeros={viajeros}
        gastos={gastos}
        onAnadir={anadirGasto}
        onQuitar={quitarGasto}
      />

      {gastos.length > 0 && <Resumen balances={balances} gastos={gastos} />}

      {(viajeros.length > 0 || gastos.length > 0) && (
        <button className="boton-reiniciar" onClick={empezarDeCero}>
          Vaciar este viaje
        </button>
      )}
    </div>
  );
}

export default App;
