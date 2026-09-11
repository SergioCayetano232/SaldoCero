import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import * as datos from "./datos";
import { hayConexion, usarCodigo } from "./supabase";
import { calcularBalances } from "./calculos";
import Entrada from "./componentes/Entrada";
import BarraViaje from "./componentes/BarraViaje";
import Viajeros from "./componentes/Viajeros";
import Gastos from "./componentes/Gastos";
import Resumen from "./componentes/Resumen";

// El viaje que hay que abrir al arrancar: el del enlace compartido (#ABC123),
// o el último en el que estuviste. Vacío si no hay ninguno.
function codigoDeArranque() {
  if (!hayConexion) return "";
  return window.location.hash.slice(1) || datos.codigoRecordado();
}

function App() {
  const [viaje, setViaje] = useState(null); // null = todavía no has entrado en ninguno
  // Solo salimos cargando si de verdad hay un viaje que recuperar.
  const [cargando, setCargando] = useState(() => codigoDeArranque() !== "");
  const [error, setError] = useState("");

  useEffect(() => {
    const codigo = codigoDeArranque();
    if (!codigo) return;

    datos
      .abrirViaje(codigo)
      .then(setViaje)
      .catch(() => datos.olvidarCodigo()) // el código ya no vale, a la pantalla de entrada
      .finally(() => setCargando(false));
  }, []);

  // El viaje de ahora mismo, para poder leerlo desde la escucha sin que esta
  // dependa de él (si dependiera, cada cambio la desmontaría y volvería a montar).
  const viajeActual = useRef(viaje);

  useEffect(() => {
    viajeActual.current = viaje;
  }, [viaje]);

  // Nos vamos enterando de lo que apunten los demás.
  const viajeId = viaje?.id;

  useEffect(() => {
    if (!viajeId) return;

    return datos.escucharCambios(() => viajeActual.current, setViaje);
  }, [viajeId]);

  // Todas las operaciones fallan igual: avisamos y dejamos el viaje como estaba.
  const hacer = useCallback(
    async (operacion) => {
      setError("");
      try {
        await operacion();
        setViaje(await datos.refrescarViaje(viaje));
      } catch (fallo) {
        setError(fallo.message);
      }
    },
    [viaje]
  );

  async function crearViaje(nombre, moneda) {
    setCargando(true);
    setError("");
    try {
      setViaje(await datos.crearViaje(nombre, moneda));
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }

  async function entrarEnViaje(codigo) {
    setCargando(true);
    setError("");
    try {
      setViaje(await datos.abrirViaje(codigo));
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }

  function salirDelViaje() {
    datos.olvidarCodigo();
    usarCodigo("");
    window.location.hash = "";
    setViaje(null);
    setError("");
  }

  function vaciarViaje() {
    const confirmado = window.confirm(
      `¿Seguro que quieres vaciar "${viaje.nombre}"? Se borran sus viajeros y gastos para todos.`
    );
    if (!confirmado) return;

    hacer(() => datos.vaciarViaje(viaje.id));
  }

  // Sin las claves de Supabase no hay nada que hacer.
  if (!hayConexion) {
    return (
      <div className="app">
        <Cabecera />
        <section className="tarjeta">
          <p className="error">
            Falta configurar Supabase. Copia <code>.env.example</code> a{" "}
            <code>.env</code> y pon ahí la URL y la clave de tu proyecto.
          </p>
        </section>
      </div>
    );
  }

  if (cargando && !viaje) {
    return (
      <div className="app">
        <Cabecera />
          <p className="vacio cargando">
          Cargando
          <span className="puntos">
            <span />
            <span />
            <span />
          </span>
        </p>
      </div>
    );
  }

  if (!viaje) {
    return (
      <div className="app">
        <Cabecera />
        <Entrada
          onCrear={crearViaje}
          onEntrar={entrarEnViaje}
          cargando={cargando}
          error={error}
        />
        <BotonInstalar />
        <Pie />
      </div>
    );
  }

  const { viajeros, gastos } = viaje;
  const balances = calcularBalances(viajeros, gastos);

  return (
    <div className="app">
      <Cabecera />

      <BarraViaje viaje={viaje} onSalir={salirDelViaje} />

      {error && <p className="error">{error}</p>}

      <Viajeros
        viajeros={viajeros}
        onAnadir={(nombre) => hacer(() => datos.anadirViajero(viaje.id, nombre))}
        onQuitar={(id) => hacer(() => datos.quitarViajero(id))}
      />

      <Gastos
        viajeros={viajeros}
        gastos={gastos}
        monedaViaje={viaje.moneda ?? "EUR"}
        onAnadir={(gasto) => hacer(() => datos.anadirGasto(viaje.id, gasto))}
        onEditar={(id, gasto) => hacer(() => datos.editarGasto(id, gasto))}
        onQuitar={(id) => hacer(() => datos.quitarGasto(id))}
      />

      {gastos.length > 0 && (
        <Resumen
          balances={balances}
          gastos={gastos}
          monedaViaje={viaje.moneda ?? "EUR"}
          saldados={viaje.saldados ?? []}
          onSaldar={(pago) => hacer(() => datos.marcarSaldado(viaje.id, pago))}
          onDesaldar={(pago) => hacer(() => datos.desmarcarSaldado(viaje.id, pago))}
          viaje={viaje}
        />
      )}

      {(viajeros.length > 0 || gastos.length > 0) && (
        <button className="boton-reiniciar" onClick={vaciarViaje}>
          Vaciar este viaje
        </button>
      )}

      <BotonInstalar />
      <Pie />
    </div>
  );
}

// El botón de instalar, cuando el navegador dice que se puede.
//
// Chrome avisa con un evento y deja guardarlo para enseñarlo cuando quieras.
// Safari no lo tiene: allí se instala desde Compartir > Añadir a inicio, y el
// botón no sale. Tampoco sale si ya la tienes instalada.
function BotonInstalar() {
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    function alPoderInstalar(evento) {
      // Si no lo paramos, Chrome saca su propio cartel cuando le apetece.
      evento.preventDefault();
      setAviso(evento);
    }

    window.addEventListener("beforeinstallprompt", alPoderInstalar);
    // Instalada: fuera el botón.
    window.addEventListener("appinstalled", () => setAviso(null));

    return () => window.removeEventListener("beforeinstallprompt", alPoderInstalar);
  }, []);

  if (!aviso) return null;

  async function instalar() {
    aviso.prompt();
    await aviso.userChoice;
    // El aviso solo sirve una vez, se haya instalado o no.
    setAviso(null);
  }

  return (
    <button className="boton-instalar" onClick={instalar}>
      <span className="instalar-icono">⬇</span>
      Instalar en el móvil
    </button>
  );
}

// Un pie discreto, que la pantalla no acabe en un vacío enorme.
function Pie() {
  return (
    <footer className="pie">
      <span className="pie-marca">SaldoCero</span>
      <span className="pie-punto">·</span>
      <span>Sin cuentas ni contraseñas</span>
      <span className="pie-punto">·</span>
      <span>Tus viajes solo en tu móvil</span>
    </footer>
  );
}

function Cabecera() {
  return (
    <header className="cabecera">
      <h1>
        <span className="saldo">Saldo</span>
        <span className="cero">Cero</span>
      </h1>
      <p>Repartimos los gastos del viaje entre todos.</p>
    </header>
  );
}

export default App;
