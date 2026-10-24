import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import * as datos from "./datos";
import { hayConexion, usarCodigo } from "./supabase";
import { balancesConBote, hayBote } from "./bote";
import { coloresDelViaje } from "./avatares";
import { borradoConEspera, queSeVaConViajero } from "./deshacer";
import { novedades, textoDeNovedades } from "./novedades";
import { turnos } from "./turnos";
import { vibrar } from "./vibrar";
import { avisoAlCerrar, estaCerrado, sugerirCerrar, ultimoApunte } from "./cerrar";
import { pagosDelViaje } from "./calculos";
import { cuantosMios, ponerGlobito } from "./globito";
import { reducirFoto } from "./tickets";
import { avisoDeArranque, codigoQueAbrir, hayQueOlvidar } from "./arranque";
import { tituloDePestana } from "./titulo";
import { temaGuardado, siguienteTema, temaDe, temaQueToca } from "./tema";
import { hayQueSubir } from "./arriba";
import { esAtajoDeshacer } from "./teclado";
import { queTrae, sinLoQueTrae, recogerTicket } from "./llegada";
import { MINIMO_PARA_FILTRAR } from "./filtros";
import { nombreDeLaRepeticion, genteParaRepetir, quienEresEnElNuevo } from "./repetirViaje";
import Entrada from "./componentes/Entrada";
import BarraViaje from "./componentes/BarraViaje";
import Viajeros from "./componentes/Viajeros";
import Bote from "./componentes/Bote";
import Gastos from "./componentes/Gastos";
import Resumen from "./componentes/Resumen";
import CargandoViaje from "./componentes/CargandoViaje";
import CifrasViaje from "./componentes/CifrasViaje";
import Atajos from "./componentes/Atajos";
import { enLista } from "./nombres";

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
  // Lo que acabas de borrar, mientras estás a tiempo de recuperarlo.
  const [borrado, setBorrado] = useState(null);
  // Cuál de los viajeros eres tú. Guardado en este navegador.
  const [soy, setSoy] = useState(null);
  // El código del viaje que acabas de crear: lo siguiente es meter a la gente.
  const [recienCreado, setRecienCreado] = useState(null);
  // Mientras se crea el repetido, que dos toques no hagan dos viajes.
  const [repitiendo, setRepitiendo] = useState(false);
  // A quién has tocado en el resumen para ver sus gastos. La vez cuenta para
  // que tocar dos veces al mismo vuelva a llevarte a la lista.
  const [verDe, setVerDe] = useState(null);
  // Y el día que has tocado en la gráfica, igual.
  const [verDia, setVerDia] = useState(null);
  // Y el gasto más caro, si lo has tocado en el resumen.
  const [verGasto, setVerGasto] = useState(null);
  // Las historias del viaje, que salen solas al cerrarlo.
  const [verHistorias, setVerHistorias] = useState(false);
  // Si se abre desde el atajo del icono o con un ticket compartido.
  const [llegada, setLlegada] = useState(() => {
    const que = queTrae(window.location.search);
    return que === "apuntar" ? { que } : null;
  });

  useEffect(() => {
    if (queTrae(window.location.search) !== "ticket") return;
    window.history.replaceState(null, "", sinLoQueTrae(window.location.href));
    // Hasta que no entras en un viaje, la foto espera aquí.
    recogerTicket()
      .then((foto) => foto && setLlegada({ que: "ticket", foto }))
      .catch(() => setError("No hemos podido coger la foto que has compartido."));
  }, []);

  useEffect(() => {
    if (llegada?.que === "apuntar") window.history.replaceState(null, "", sinLoQueTrae(window.location.href));
  }, [llegada]);

  // El otro atajo del icono. No va con la llegada: esa te lleva al formulario.
  const aLasCuentas = useRef(queTrae(window.location.search) === "cuentas");

  useEffect(() => {
    if (!aLasCuentas.current) return;
    window.history.replaceState(null, "", sinLoQueTrae(window.location.href));
  }, []);

  useEffect(() => {
    if (!viaje || !aLasCuentas.current) return;
    aLasCuentas.current = false;
    document.querySelector(".saldar")?.scrollIntoView({ block: "start" });
  }, [viaje]);

  useEffect(() => {
    const codigo = codigoDeArranque();
    if (!codigo) return;
    const desdeEnlace = window.location.hash.length > 1;

    datos
      .abrirViaje(codigo)
      .then((abierto) => {
        setViaje(abierto);
        setSoy(datos.soyEn(abierto.codigo));
      })
      .catch((fallo) => {
        // A la pantalla de entrada diciendo por qué.
        if (hayQueOlvidar(fallo, desdeEnlace)) datos.olvidarCodigo();
        setError(avisoDeArranque(fallo, desdeEnlace));
      })
      .finally(() => setCargando(false));
  }, []);

  // El viaje de ahora mismo, para poder leerlo desde la escucha sin que esta
  // dependa de él (si dependiera, cada cambio la desmontaría y volvería a montar).
  const viajeActual = useRef(viaje);

  useEffect(() => {
    viajeActual.current = viaje;
  }, [viaje]);

  // Lo que está pendiente de borrar, para rematarlo al irte (ver más abajo).
  const borradoActual = useRef(null);

  useEffect(() => {
    borradoActual.current = borrado;
  }, [borrado]);

  // Un enlace de otro viaje con la app ya abierta: al arrancar solo se lee una vez.
  useEffect(() => {
    function alCambiarEnlace() {
      const codigo = codigoQueAbrir(window.location.hash, viajeActual.current?.codigo);
      if (!codigo) return;

      setError("");
      Promise.resolve(borradoActual.current?.espera.ahora())
        .then(() => datos.abrirViaje(codigo))
        .then((abierto) => {
          setViaje(abierto);
          setSoy(datos.soyEn(abierto.codigo));
        })
        .catch((fallo) => setError(avisoDeArranque(fallo, true)));
    }

    window.addEventListener("hashchange", alCambiarEnlace);
    return () => window.removeEventListener("hashchange", alCambiarEnlace);
  }, []);

  const nombreDelViaje = viaje?.nombre;

  useEffect(() => {
    document.title = tituloDePestana(nombreDelViaje);
  }, [nombreDelViaje]);

  // Lo que han apuntado los demás, mientras dura el aviso.
  const [novedad, setNovedad] = useState(null);
  // Lo que has creado tú desde aquí, para no avisarte de ello como si fuera de otro.
  const propios = useRef(new Set());
  // Mientras guardas algo, lo que llegue puede ser lo tuyo a medio guardar.
  const enMarcha = useRef(0);
  // Para que una lectura que llega tarde no deshaga lo que acabas de hacer.
  const [lecturas] = useState(turnos);

  // Nos vamos enterando de lo que apunten los demás.
  const viajeId = viaje?.id;

  useEffect(() => {
    if (!viajeId) return;
    let reloj;

    const dejarDeEscuchar = datos.escucharCambios(
      () => viajeActual.current,
      (nuevo) => {
        const hay = novedades(viajeActual.current, nuevo, propios.current);
        setViaje(nuevo);

        if (enMarcha.current > 0) return;
        const texto = textoDeNovedades(hay, nuevo.viajeros, nuevo.moneda ?? "EUR");
        if (!texto) return;

        clearTimeout(reloj);
        setNovedad({ texto, ids: new Set([...hay.gastos, ...hay.viajeros].map((x) => x.id)) });
        reloj = setTimeout(() => setNovedad(null), 4500);
      },
      lecturas
    );

    return () => {
      dejarDeEscuchar();
      clearTimeout(reloj);
    };
  }, [viajeId, lecturas]);

  // Todas las operaciones fallan igual: avisamos y dejamos el viaje como estaba.
  // Devuelve si ha ido bien, por si alguien quiere hacer algo después.
  const hacer = useCallback(
    async (operacion) => {
      setError("");
      enMarcha.current++;
      try {
        await operacion();
        const turno = lecturas.pedir();
        const nuevo = await datos.refrescarViaje(viaje);
        if (lecturas.vale(turno)) setViaje(nuevo);
        vibrar("toque");
        return true;
      } catch (fallo) {
        setError(fallo.message);
        vibrar("error");
        return false;
      } finally {
        enMarcha.current--;
      }
    },
    [viaje, lecturas]
  );

  // Borrar algo, dando unos segundos para arrepentirse.
  // Lo quitamos de la pantalla ya, pero de la base de datos solo si no deshaces.
  const borrarConAviso = useCallback((id, que, quitarDeVerdad) => {
    setError("");
    vibrar("quitar");
    const deQueViaje = viajeActual.current?.id;

    const espera = borradoConEspera(quitarDeVerdad, async (fallo) => {
      setBorrado(null);
      if (fallo) setError(fallo.message);

      // Tanto si se ha borrado como si ha fallado, volvemos a leer el viaje:
      // así la lista deja de esconderlo y enseña lo que hay de verdad.
      try {
        const turno = lecturas.pedir();
        const releido = await datos.refrescarViaje(viajeActual.current);
        // Si mientras tanto te has ido a otro viaje, no te devolvemos a este.
        if (viajeActual.current?.id === deQueViaje && lecturas.vale(turno)) setViaje(releido);
      } catch {
        // Si no se puede releer, lo cogerá la escucha de cada pocos segundos.
      }
    });

    setBorrado({ id, que, espera });
  }, [lecturas]);

  // Si cierras la pestaña o te vas a otra app en esos segundos, se borra ya: si
  // no, el reloj muere con la página y lo borrado vuelve a salir.
  useEffect(() => {
    const borrarYa = () => borradoActual.current?.espera.ahora();
    const alEsconderse = () => document.hidden && borrarYa();

    document.addEventListener("visibilitychange", alEsconderse);
    window.addEventListener("pagehide", borrarYa);
    return () => {
      document.removeEventListener("visibilitychange", alEsconderse);
      window.removeEventListener("pagehide", borrarYa);
    };
  }, []);

  // Cerrar con un gasto (o su foto) a medio subir lo pierde. El texto del aviso
  // lo pone el navegador.
  useEffect(() => {
    function avisar(evento) {
      if (enMarcha.current > 0) evento.preventDefault();
    }

    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, []);

  function deshacerBorrado() {
    // Como todavía no se había tocado nada, basta con dejar de ocultarlo.
    borrado?.espera.cancelar();
    setBorrado(null);
  }

  useEffect(() => {
    if (!borrado) return;

    function alPulsar(e) {
      if (!esAtajoDeshacer(e)) return;
      e.preventDefault();
      borrado.espera.cancelar();
      setBorrado(null);
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [borrado]);

  async function crearViaje(nombre, moneda) {
    setCargando(true);
    setError("");
    try {
      const creado = await datos.crearViaje(nombre, moneda);
      setViaje(creado);
      setRecienCreado(creado.codigo);
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
      const abierto = await datos.abrirViaje(codigo);
      setViaje(abierto);
      setSoy(datos.soyEn(abierto.codigo));
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }

  async function salirDelViaje() {
    // Antes de soltar el código: sin él, la base de datos no dejaría borrarlo.
    await borradoActual.current?.espera.ahora();
    datos.olvidarCodigo();
    usarCodigo("");
    window.location.hash = "";
    setViaje(null);
    setSoy(null);
    setRecienCreado(null);
    setVerHistorias(false);
    setError("");
  }

  function elegirQuienSoy(viajeroId) {
    // Si vuelves a pulsar el mismo, dejas de ser nadie.
    const nuevo = viajeroId === soy ? null : viajeroId;
    datos.soyYo(viaje.codigo, nuevo);
    setSoy(nuevo);
  }

  function vaciarViaje() {
    const confirmado = window.confirm(
      `¿Seguro que quieres vaciar "${viaje.nombre}"? Se borran sus viajeros y gastos para todos.`
    );
    if (!confirmado) return;

    hacer(() => datos.vaciarViaje(viaje.id));
  }

  function cerrarViaje() {
    const pagos = pagosDelViaje(balances, viaje);
    const confirmado = window.confirm(avisoAlCerrar(viaje.nombre, pagos, viaje.moneda ?? "EUR"));
    if (!confirmado) return;

    hacer(() => datos.cerrarViaje(viaje.id)).then((bien) => bien && setVerHistorias(true));
  }

  async function repetirViaje(gente) {
    const nombre = nombreDeLaRepeticion(viaje.nombre);
    const quienes = enLista(gente.map((v) => v.nombre));
    if (!window.confirm(`¿Crear "${nombre}" con ${quienes}? Empieza sin gastos.`)) return;

    setRepitiendo(true);
    setError("");
    try {
      // Lo que estés borrando, antes de cambiar de código, como al salir.
      await borradoActual.current?.espera.ahora();
      const nuevo = await datos.repetirViaje(nombre, viaje.moneda ?? "EUR", genteParaRepetir(gente));
      const yo = quienEresEnElNuevo(soy, gente, nuevo.viajeros);
      datos.soyYo(nuevo.codigo, yo);
      // Si se queda el enlace del viaje viejo, al recargar te devolvería a él.
      window.location.hash = "";
      setViaje(nuevo);
      setSoy(yo);
      setRecienCreado(null);
      if (nuevo.sinGente) setError("Hemos creado el viaje, pero no hemos podido pasar a la gente. Añádela a mano.");
      window.scrollTo({ top: 0 });
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setRepitiendo(false);
    }
  }

  function reabrirViaje() {
    if (!window.confirm(`¿Reabrir "${viaje.nombre}"? Se podrán volver a tocar los gastos.`)) return;
    // Si lo reabres es para tocar algo: que no te sugiera cerrarlo nada más abrirlo.
    datos.guardarAunNoCerrar(viaje.codigo, ultimoApunte(viaje.gastos));
    hacer(() => datos.cerrarViaje(viaje.id, false));
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
        <CargandoViaje />
      </div>
    );
  }

  if (!viaje) {
    return (
      <div className="app">
        <Cabecera />
        {llegada?.foto && (
          <p className="aviso-ticket" role="status">
            📷 Tienes la foto de un ticket esperando. Entra en el viaje y la ponemos en el gasto.
          </p>
        )}
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

  // Lo que está a medio borrar no sale en la lista ni cuenta para las cuentas,
  // aunque en la base de datos siga estando unos segundos más.
  const seVa = borrado?.id;
  const viajeros = viaje.viajeros.filter((v) => v.id !== seVa);
  const gastos = viaje.gastos.filter((g) => g.id !== seVa && g.pagadorId !== seVa);
  const parciales = (viaje.parciales ?? []).filter((p) => p.id !== seVa);
  const aportaciones = (viaje.aportaciones ?? []).filter((a) => a.id !== seVa && a.viajeroId !== seVa);
  const balances = balancesConBote(viajeros, gastos, parciales, aportaciones);
  const colores = coloresDelViaje(viajeros.map((v) => v.nombre));
  const cerrado = estaCerrado(viaje);

  return (
    <div className="app">
      <Cabecera />

      <BarraViaje
        viaje={viaje}
        onSalir={salirDelViaje}
        cerrado={cerrado}
        onReabrir={reabrirViaje}
        onRenombrar={(nombre) => hacer(() => datos.renombrarViaje(viaje, nombre))}
      />

      <AvisoSinConexion />
      {error && <p className="error">{error}</p>}
      <SugerirCerrar key={`cerrar-${viaje.codigo}-${cerrado}`} codigo={viaje.codigo} gastos={gastos} cerrado={cerrado} onCerrar={cerrarViaje} />

      <Viajeros
        viajeros={viajeros}
        colores={colores}
        enfocar={recienCreado === viaje.codigo}
        soy={soy}
        onSoyYo={elegirQuienSoy}
        recienLlegados={novedad?.ids}
        cerrado={cerrado}
        onAnadir={(nombre) =>
          hacer(async () => propios.current.add((await datos.anadirViajero(viaje.id, nombre)).id))
        }
        onRenombrar={(id, nombre) => hacer(() => datos.renombrarViajero(id, nombre))}
        onCobro={(id, cobro) => hacer(() => datos.ponerCobro(id, cobro))}
        onQuitar={(id, nombre) =>
          borrarConAviso(
            id,
            queSeVaConViajero({ id, nombre }, gastos, viaje.moneda ?? "EUR"),
            () => datos.quitarViajero(id)
          )
        }
      />

      {viajeros.length > 0 && (
        <Bote
          viajeros={viajeros}
          aportaciones={aportaciones}
          gastos={gastos}
          colores={colores}
          moneda={viaje.moneda ?? "EUR"}
          cerrado={cerrado}
          onPoner={(lista) => hacer(() => datos.ponerEnElBote(viaje.id, lista))}
          onQuitar={(a, nombre) =>
            borrarConAviso(a.id, `lo que puso ${nombre} en el bote`, () => datos.quitarDelBote(a.id))
          }
        />
      )}

      <Gastos
        // Otro viaje, otro formulario: que no se cuele lo que escribías en el anterior.
        key={viaje.codigo}
        codigo={viaje.codigo}
        nombreViaje={viaje.nombre}
        viajeros={viajeros}
        colores={colores}
        hayBote={hayBote(aportaciones, gastos)}
        gastos={gastos}
        monedaViaje={viaje.moneda ?? "EUR"}
        presupuesto={viaje.presupuesto}
        recienLlegados={novedad?.ids}
        cerrado={cerrado}
        soy={soy}
        verDe={verDe}
        verDia={verDia}
        verGasto={verGasto}
        llegada={llegada}
        onLlegadaUsada={() => setLlegada(null)}
        onAnadir={(gasto) =>
          hacer(async () => {
            // La foto se reduce antes de guardar nada: si no se puede leer, mejor
            // enterarse sin haber apuntado el gasto a medias.
            const foto = gasto.foto && (await reducirFoto(gasto.foto));
            const nuevo = await datos.anadirGasto(viaje.id, gasto);
            propios.current.add(nuevo.id);
            if (foto) await datos.ponerTicket(viaje.id, nuevo.id, foto);
          })
        }
        onEditar={(id, gasto) =>
          hacer(async () => {
            const foto = gasto.foto && (await reducirFoto(gasto.foto));
            await datos.editarGasto(id, gasto);
            if (foto) await datos.ponerTicket(viaje.id, id, foto, gasto.ticketAnterior);
            else if (gasto.quitarFoto) await datos.quitarTicket(id, gasto.ticketAnterior);
          })
        }
        onQuitar={(id, concepto, ticket) =>
          borrarConAviso(id, `"${concepto}"`, () => datos.quitarGasto(id, ticket))
        }
        verTicket={datos.urlDelTicket}
      />

      {cerrado && (
        <CifrasViaje
          gastos={gastos}
          balances={balances}
          nombre={viaje.nombre}
          moneda={viaje.moneda ?? "EUR"}
          pendientes={pagosDelViaje(balances, viaje).filter((p) => !p.saldado).length}
          verHistorias={verHistorias}
          onHistorias={setVerHistorias}
        />
      )}

      {gastos.length > 0 && (
        <Resumen
          balances={balances}
          colores={colores}
          gastos={gastos}
          soy={soy}
          monedaViaje={viaje.moneda ?? "EUR"}
          saldados={viaje.saldados ?? []}
          onSaldar={(pago) => hacer(() => datos.marcarSaldado(viaje.id, pago))}
          onSaldarVarios={(pagos) => hacer(() => datos.marcarVariosSaldados(viaje.id, pagos))}
          onDesaldar={(pago) => hacer(() => datos.desmarcarSaldado(viaje.id, pago))}
          cerrado={cerrado}
          onPresupuesto={(cantidad) => hacer(() => datos.ponerPresupuesto(viaje.id, cantidad))}
          onRedondear={(redondear) => hacer(() => datos.ponerRedondeo(viaje.id, redondear))}
          parciales={parciales}
          aportaciones={aportaciones}
          onParcial={(parcial) => hacer(() => datos.anadirParcial(viaje.id, parcial))}
          onQuitarParcial={(parcial, de, a) =>
            borrarConAviso(parcial.id, `el pago de ${de} a ${a}`, () => datos.quitarParcial(parcial.id))
          }
          viaje={viaje}
          onVerGastos={
            gastos.length >= MINIMO_PARA_FILTRAR
              ? (id) => setVerDe((antes) => ({ id, vez: (antes?.vez ?? 0) + 1 }))
              : undefined
          }
          onVerGasto={(id) => setVerGasto((antes) => ({ id, vez: (antes?.vez ?? 0) + 1 }))}
          onVerDia={
            gastos.length >= MINIMO_PARA_FILTRAR
              ? (fecha) => setVerDia((antes) => ({ fecha, vez: (antes?.vez ?? 0) + 1 }))
              : undefined
          }
        />
      )}

      {(viajeros.length > 0 || gastos.length > 0) && (
        <div className="botones-final">
          {!cerrado && gastos.length > 0 && (
            <button className="boton-cerrar-viaje" onClick={cerrarViaje}>
              🔒 Cerrar el viaje
            </button>
          )}
          {/* Con uno solo no hay grupo que repetir. */}
          {viajeros.length > 1 && (
            <button className="boton-repetir-viaje" onClick={() => repetirViaje(viajeros)} disabled={repitiendo}>
              {repitiendo ? "Creando…" : "🔁 Repetir con la misma gente"}
            </button>
          )}
          {!cerrado && (
            <button className="boton-reiniciar" onClick={vaciarViaje}>
              Vaciar este viaje
            </button>
          )}
        </div>
      )}

      {novedad && (
        <div className="novedad" role="status" key={novedad.texto}>
          <span className="novedad-icono">🔔</span>
          {novedad.texto}
        </div>
      )}

      {borrado && (
        <div className="deshacer">
          <span>Has quitado {borrado.que}</span>
          <button onClick={deshacerBorrado} title="También con Ctrl+Z (⌘Z en Mac)">
            Deshacer
          </button>
        </div>
      )}

      <Globito cuantos={cuantosMios(pagosDelViaje(balances, viaje), soy)} />
      <BotonArriba />
      <BotonInstalar />
      <Pie enViaje />
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

function SugerirCerrar({ codigo, gastos, cerrado, onCerrar }) {
  const [descartado, setDescartado] = useState(() => datos.leerAunNoCerrar(codigo));
  const dias = sugerirCerrar({ gastos, cerrado, descartado });
  if (!dias) return null;

  function aunNo() {
    const ultimo = ultimoApunte(gastos);
    datos.guardarAunNoCerrar(codigo, ultimo);
    setDescartado(ultimo);
  }

  return (
    <div className="sugerir-cerrar" role="status">
      <span className="viaje-cerrado-icono" aria-hidden="true">
        🏁
      </span>
      <p>
        <strong>¿Habéis vuelto ya?</strong> Hace {dias} días que nadie apunta nada. Cerrado, los gastos
        ya no cambian.
      </p>
      <div className="sugerir-cerrar-botones">
        <button className="enlace" onClick={onCerrar}>
          Cerrar
        </button>
        <button className="enlace aun-no" onClick={aunNo}>
          Aún no
        </button>
      </div>
    </div>
  );
}

// Mejor saberlo antes de apuntar nada que con el error al guardar.
function AvisoSinConexion() {
  const [conRed, setConRed] = useState(() => navigator.onLine);

  useEffect(() => {
    const ponerConRed = () => setConRed(true);
    const ponerSinRed = () => setConRed(false);
    window.addEventListener("online", ponerConRed);
    window.addEventListener("offline", ponerSinRed);
    return () => {
      window.removeEventListener("online", ponerConRed);
      window.removeEventListener("offline", ponerSinRed);
    };
  }, []);

  if (conRed) return null;

  return (
    <p className="sin-conexion" role="status">
      📡 Sin conexión: hasta que vuelva no se puede guardar nada.
    </p>
  );
}

// No pinta nada: solo pone el número en el icono. Al salir del viaje se va con él.
function Globito({ cuantos }) {
  useEffect(() => {
    ponerGlobito(cuantos);
  }, [cuantos]);

  useEffect(() => () => ponerGlobito(0), []);

  return null;
}

// En el móvil, con muchos gastos, el formulario queda muy lejos.
function BotonArriba() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function alBajar() {
      setVisible(hayQueSubir(window.scrollY, window.innerHeight));
    }

    alBajar();
    window.addEventListener("scroll", alBajar, { passive: true });
    return () => window.removeEventListener("scroll", alBajar);
  }, []);

  if (!visible) return null;

  function subir() {
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: quieto ? "auto" : "smooth" });
  }

  return (
    <button className="boton-arriba" onClick={subir} aria-label="Volver arriba" title="Volver arriba">
      ↑
    </button>
  );
}

// Un pie discreto, que la pantalla no acabe en un vacío enorme.
// Los atajos solo sirven dentro de un viaje, así que fuera no se enseñan.
function Pie({ enViaje = false }) {
  return (
    <footer className="pie">
      <span className="pie-marca">SaldoCero</span>
      <span className="pie-punto">·</span>
      <span>Sin cuentas ni contraseñas</span>
      <span className="pie-punto">·</span>
      <span>Solo entra quien tiene el código</span>
      <span className="pie-firma">
        Hecho por Sergio Cayetano ·{" "}
        <a
          className="pie-enlace"
          href="https://github.com/SergioCayetano232/SaldoCero"
          target="_blank"
          rel="noopener noreferrer"
        >
          Código en GitHub
        </a>
      </span>
      <BotonTema />
      {enViaje && <Atajos />}
    </footer>
  );
}

// El color de la barra del móvil, a juego con el tema.
const COLOR_BARRA = { claro: "#0e7c7b", oscuro: "#0b1518" };

function BotonTema() {
  const [tema, setTema] = useState(() => temaGuardado(datos.leerTema()));

  useEffect(() => {
    const sistema = matchMedia("(prefers-color-scheme: dark)");
    const papel = matchMedia("print");

    function pintar() {
      const toca = temaQueToca(tema, sistema.matches, papel.matches);
      document.documentElement.dataset.tema = toca;
      for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
        meta.content = COLOR_BARRA[toca];
      }
    }

    pintar();
    // En automático, si el móvil cambia a oscuro al anochecer, la app también.
    sistema.addEventListener("change", pintar);
    papel.addEventListener("change", pintar);
    return () => {
      sistema.removeEventListener("change", pintar);
      papel.removeEventListener("change", pintar);
    };
  }, [tema]);

  function cambiar() {
    const nuevo = siguienteTema(tema);
    setTema(nuevo);
    datos.guardarTema(nuevo);
  }

  const { icono, nombre } = temaDe(tema);

  return (
    <button className="pie-tema" onClick={cambiar} title="Cambiar el tema">
      <span aria-hidden="true">{icono}</span> Tema: {nombre.toLowerCase()}
    </button>
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
