import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import "./App.css";
import * as datos from "./datos";
import { hayConexion, usarCodigo } from "./supabase";
import { balancesConBote, hayBote } from "./bote";
import { coloresDelViaje } from "./avatares";
import { conColoresDeGrupos } from "./juntos";
import { borradoConEspera, deshacerEdicion, ESPERA, queSeVaConGastos, queSeVaConViajero } from "./deshacer";
import { textoPasados } from "./recategorizar";
import { novedades, textoDeNovedades } from "./novedades";
import { turnos } from "./turnos";
import { vibrar } from "./vibrar";
import { avisoAlCerrar, estaCerrado, sugerirCerrar, ultimoApunte } from "./cerrar";
import { pagosDelViaje } from "./calculos";
import { hoy } from "./fechas";
import { cuantosMios, ponerGlobito } from "./globito";
import { reducirFoto, fotosDeGasto } from "./tickets";
import { avisoDeArranque, codigoQueAbrir, hayQueOlvidar } from "./arranque";
import { tituloDelViaje, miNeto } from "./titulo";
import { temaGuardado, siguienteTema, temaDe, temaQueToca } from "./tema";
import { hayQueSubir } from "./arriba";
import { esAtajoDeshacer, esAtajoTema } from "./teclado";
import { queTrae, sinLoQueTrae, recogerTicket } from "./llegada";
import { MINIMO_PARA_FILTRAR } from "./filtros";
import { resumenDelViaje } from "./anterior";
import { nombreDeLaRepeticion, genteParaRepetir, quienEresEnElNuevo, pendientesParaPasar, gastosDeLoPendiente, preguntaDePendientes } from "./repetirViaje";
import Entrada from "./componentes/Entrada";
import BarraViaje from "./componentes/BarraViaje";
import Viajeros from "./componentes/Viajeros";
import Bote from "./componentes/Bote";
import ListaCompra from "./componentes/ListaCompra";
import Gastos from "./componentes/Gastos";
import Resumen from "./componentes/Resumen";
import Actividad from "./componentes/Actividad";
import CargandoViaje from "./componentes/CargandoViaje";
import CifrasViaje from "./componentes/CifrasViaje";
import Atajos from "./componentes/Atajos";
import { enLista } from "./nombres";
import { usarCategoriasPropias } from "./categorias";
import { destinosPosibles, pasarGasto } from "./mover";
import { loTuyo } from "./tuAno";
import { estaDiscreto, ponerDiscreto, alCambiarDiscreto } from "./discreto";
import { alTocar, trasTocar } from "./reacciones";
import { conceptoDeCompras, categoriaDeCompras } from "./compras";
import { t, idiomaActual, alCambiarIdioma, usarIdioma, guardarIdioma, otroIdioma, IDIOMAS } from "./idioma";

// Fuera del componente: dentro, el linter no deja tocar window.location.
function quitarEnlace() {
  window.location.hash = "";
}

// El viaje que hay que abrir al arrancar: el del enlace compartido (#ABC123),
// o el último en el que estuviste. Vacío si no hay ninguno.
function codigoDeArranque() {
  if (!hayConexion) return "";
  return window.location.hash.slice(1) || datos.codigoRecordado();
}

function App() {
  // Al cambiar de idioma se repinta todo desde aquí.
  const idioma = useSyncExternalStore(alCambiarIdioma, idiomaActual);
  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);
  // Igual con el modo discreto: todas las cifras salen de conMoneda.
  const discreto = useSyncExternalStore(alCambiarDiscreto, estaDiscreto);
  const [viaje, setViaje] = useState(null); // null = todavía no has entrado en ninguno
  // Las categorías propias se apuntan antes de pintar nada, que todo lo de abajo las lee.
  usarCategoriasPropias(viaje?.categorias);
  // Solo salimos cargando si de verdad hay un viaje que recuperar.
  const [cargando, setCargando] = useState(() => codigoDeArranque() !== "");
  const [error, setError] = useState("");
  // Lo que acabas de borrar, mientras estás a tiempo de recuperarlo.
  const [borrado, setBorrado] = useState(null);
  // Lo último editado, con cómo estaba cada gasto, mientras se puede deshacer.
  const [editado, setEditado] = useState(null);
  // Lo comprado que va camino del formulario de gastos.
  const [deCompra, setDeCompra] = useState(null);
  // Cuál de los viajeros eres tú. Guardado en este navegador.
  const [soy, setSoy] = useState(null);
  useEffect(() => datos.usarViajero(soy), [soy]);
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
      .catch(() => setError(t("No hemos podido coger la foto que has compartido.")));
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

  useEffect(() => {
    document.title = tituloDelViaje(viaje, soy);
  }, [viaje, soy, discreto]);

  // Lo cierre quien lo cierre, aquí o desde otro móvil, en "Tus viajes" sale el candado.
  const codigoAbierto = viaje?.codigo;
  const estaCerradoYa = estaCerrado(viaje);

  useEffect(() => {
    if (codigoAbierto) datos.cerradoEnHistorial(codigoAbierto, estaCerradoYa);
  }, [codigoAbierto, estaCerradoYa]);

  // Y lo que debes o te deben, para verlo desde la lista sin entrar.
  const neto = miNeto(viaje, soy);

  useEffect(() => {
    if (codigoAbierto) datos.netoEnHistorial(codigoAbierto, neto);
  }, [codigoAbierto, neto]);

  // Y lo que te tocó pagar, para "tu año". Sueltos, que el objeto es nuevo en cada pintada.
  const loMio = loTuyo(viaje, soy);
  const tuyo = loMio?.tuyo ?? null;
  const anoDelViaje = loMio?.ano ?? null;

  useEffect(() => {
    if (codigoAbierto) datos.loTuyoEnHistorial(codigoAbierto, tuyo === null ? null : { tuyo, ano: anoDelViaje });
  }, [codigoAbierto, tuyo, anoDelViaje]);

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

    // Uno solo a la vez: el aviso del borrado tapa al de la edición.
    setEditado(null);
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

  // Editar no tiene espera, ya está guardado: deshacer es volver a guardar lo de antes.
  function deshacerEditado() {
    const { cambios } = editado;
    setEditado(null);
    hacer(() => Promise.all(cambios.map(({ id, antes }) => datos.editarGasto(id, antes))));
  }

  useEffect(() => {
    if (!editado) return;
    const reloj = setTimeout(() => setEditado(null), ESPERA);

    function alPulsar(e) {
      if (!esAtajoDeshacer(e)) return;
      e.preventDefault();
      deshacerEditado();
    }

    window.addEventListener("keydown", alPulsar);
    return () => {
      clearTimeout(reloj);
      window.removeEventListener("keydown", alPulsar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editado]);

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
      t('¿Seguro que quieres vaciar "{nombre}"? Se borran sus viajeros y gastos para todos.', { nombre: viaje.nombre })
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
    const pendientes = pendientesParaPasar(pagosDelViaje(balances, viaje));
    if (!window.confirm(t('¿Crear "{nombre}" con {quienes}? Empieza sin gastos.', { nombre, quienes }))) return;
    // Aceptar es pasarlas; cancelar, empezar de cero y dejarlas aquí.
    const pasar = pendientes.length > 0 && window.confirm(preguntaDePendientes(pendientes, nombre, viaje.moneda ?? "EUR"));

    setRepitiendo(true);
    setError("");
    try {
      // Lo que estés borrando, antes de cambiar de código, como al salir.
      await borradoActual.current?.espera.ahora();
      const anterior = resumenDelViaje(viaje.nombre, viaje.moneda ?? "EUR", gastos, viajeros);
      const creado = await datos.repetirViaje(nombre, viaje.moneda ?? "EUR", genteParaRepetir(gente), anterior);
      const yo = quienEresEnElNuevo(soy, gente, creado.viajeros);
      // Ya, que lo pendiente que se pase tiene que salir a tu nombre.
      datos.usarViajero(yo);
      let aviso = creado.sinGente ? t("Hemos creado el viaje, pero no hemos podido pasar a la gente. Añádela a mano.") : "";
      if (pasar && !creado.sinGente) {
        const pares = gastosDeLoPendiente(pendientes, gente, creado.viajeros, { nombre: viaje.nombre, moneda: viaje.moneda ?? "EUR", dia: hoy() });
        aviso = await datos.pasarLoPendiente(viaje, creado, pares, yo).then(() => "", (fallo) => fallo.message);
      }
      // Lo que se haya pasado, aunque sea a medias, tiene que verse.
      const nuevo = pasar && !creado.sinGente ? await datos.refrescarViaje(creado).catch(() => creado) : creado;
      datos.soyYo(nuevo.codigo, yo);
      // Si se queda el enlace del viaje viejo, al recargar te devolvería a él.
      quitarEnlace();
      setViaje(nuevo);
      setSoy(yo);
      setRecienCreado(null);
      if (aviso) setError(aviso);
      window.scrollTo({ top: 0 });
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setRepitiendo(false);
    }
  }

  function reabrirViaje() {
    if (!window.confirm(t('¿Reabrir "{nombre}"? Se podrán volver a tocar los gastos.', { nombre: viaje.nombre }))) return;
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
  // Uno o varios: al quitar los gastos filtrados se van todos juntos.
  const seVan = new Set([borrado?.id ?? []].flat());
  const viajeros = viaje.viajeros.filter((v) => !seVan.has(v.id));
  const gastos = viaje.gastos.filter((g) => !seVan.has(g.id) && !seVan.has(g.pagadorId));
  const parciales = (viaje.parciales ?? []).filter((p) => !seVan.has(p.id));
  const aportaciones = (viaje.aportaciones ?? []).filter((a) => !seVan.has(a.id) && !seVan.has(a.viajeroId));
  const compras = (viaje.compras ?? []).filter((c) => !seVan.has(c.id));
  const balances = balancesConBote(viajeros, gastos, parciales, aportaciones);
  const colores = conColoresDeGrupos(coloresDelViaje(viajeros.map((v) => v.nombre)), viajeros);
  const cerrado = estaCerrado(viaje);
  // Con el código de mirar es como un viaje cerrado, pero sin poder ni pagar.
  const soloVer = Boolean(viaje.soloVer);
  const fijo = cerrado || soloVer;

  return (
    <div className="app">
      <Cabecera />

      <BarraViaje
        viaje={viaje}
        onSalir={salirDelViaje}
        cerrado={cerrado}
        soloVer={soloVer}
        onCodigoParaVer={datos.codigoParaVer}
        onReabrir={reabrirViaje}
        onRenombrar={(nombre) => hacer(() => datos.renombrarViaje(viaje, nombre))}
        onCambiarMoneda={(moneda) => hacer(() => datos.cambiarMoneda(viaje, moneda))}
        discreto={discreto}
        onDiscreto={() => {
          ponerDiscreto(!discreto);
          datos.guardarDiscreto(!discreto);
        }}
      />

      <AvisoSinConexion />
      {error && <p className="error">{error}</p>}
      {!soloVer && (
        <SugerirCerrar key={`cerrar-${viaje.codigo}-${cerrado}`} codigo={viaje.codigo} gastos={gastos} cerrado={cerrado} onCerrar={cerrarViaje} />
      )}

      <Viajeros
        viajeros={viajeros}
        colores={colores}
        enfocar={recienCreado === viaje.codigo}
        soy={soy}
        onSoyYo={elegirQuienSoy}
        recienLlegados={novedad?.ids}
        cerrado={fijo}
        soloVer={soloVer}
        onAnadir={(nombre) =>
          hacer(async () => propios.current.add((await datos.anadirViajero(viaje.id, nombre)).id))
        }
        onRenombrar={(id, nombre) => hacer(() => datos.renombrarViajero(id, nombre))}
        onCobro={(id, cobro) => hacer(() => datos.ponerCobro(id, cobro))}
        onJuntar={(id, conId) => hacer(() => datos.juntarViajero(id, conId))}
        onEstancia={(id, desde, hasta) => hacer(() => datos.ponerEstancia(id, desde, hasta))}
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
          cerrado={fijo}
          onPoner={(lista) => hacer(() => datos.ponerEnElBote(viaje.id, lista))}
          onQuitar={(a, nombre) =>
            borrarConAviso(a.id, t("lo que puso {nombre} en el bote", { nombre }), () => datos.quitarDelBote(a.id))
          }
        />
      )}

      <ListaCompra
        compras={compras}
        cerrado={fijo}
        onApuntar={(textos) => hacer(() => datos.apuntarCompras(viaje.id, textos))}
        onMarcar={async (cosa, comprado) => {
          const ponerla = (valor) =>
            setViaje((v) => ({ ...v, compras: v.compras.map((c) => (c.id === cosa.id ? { ...c, comprado: valor } : c)) }));
          ponerla(comprado);
          if (!(await hacer(() => datos.marcarCompra(cosa.id, comprado)))) ponerla(!comprado);
        }}
        onQuitar={(cosa) => borrarConAviso(cosa.id, `"${cosa.texto}"`, () => datos.quitarCompras([cosa.id]))}
        onGasto={(cosas) =>
          setDeCompra({ ids: cosas.map((c) => c.id), concepto: conceptoDeCompras(cosas), categoria: categoriaDeCompras(cosas) })
        }
      />

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
        topes={viaje.topes ?? {}}
        onCategorias={(categorias) => hacer(() => datos.ponerCategorias(viaje.id, categorias))}
        recienLlegados={novedad?.ids}
        cerrado={fijo}
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
            const nuevo = await datos.anadirGasto(viaje.id, gasto, soy);
            propios.current.add(nuevo.id);
            if (foto) await datos.ponerTicket(viaje.id, nuevo.id, foto);
          })
        }
        onEditar={async (id, gasto) => {
          const antes = deshacerEdicion(gastos.find((g) => g.id === id), gasto);
          const bien = await hacer(async () => {
            const foto = gasto.foto && (await reducirFoto(gasto.foto));
            await datos.editarGasto(id, gasto);
            if (foto) await datos.ponerTicket(viaje.id, id, foto, gasto.ticketAnterior);
            else if (gasto.quitarFoto) await datos.quitarFoto(gastos.find((g) => g.id === id), gasto.ticketAnterior);
          });
          if (bien && antes) {
            setEditado({ texto: t('Has cambiado "{concepto}"', { concepto: gasto.concepto }), cambios: [{ id, antes }], viajeId: viaje.id });
          }
          return bien;
        }}
        onCambiarCategoria={async (cambios, categoria) => {
          const bien = await hacer(() => Promise.all(cambios.map((c) => datos.editarGasto(c.id, c.despues))));
          if (bien) setEditado({ texto: textoPasados(cambios.length, categoria), cambios, viajeId: viaje.id });
        }}
        // Uno detrás de otro, para que queden en la lista en el orden en que los pegaste.
        onDuda={(id, texto) => hacer(() => datos.ponerDuda(id, texto, soy))}
        deCompra={deCompra}
        onCompraApuntada={(ids) => hacer(() => datos.quitarCompras(ids))}
        // Hay que saber quién eres. Con el viaje cerrado sí, mirando no.
        onReaccionar={
          soloVer || !soy
            ? null
            : async (gasto, emoji) => {
                const que = alTocar(gasto.reacciones, soy, emoji);
                const ponerlas = (reacciones) =>
                  setViaje((v) => ({ ...v, gastos: v.gastos.map((g) => (g.id === gasto.id ? { ...g, reacciones } : g)) }));
                // Se ve al momento. Si no se guarda, vuelve como estaba.
                ponerlas(trasTocar(gasto.reacciones, soy, emoji));
                const bien = await hacer(() => datos.reaccionar(gasto.id, soy, emoji, que));
                if (!bien) ponerlas(gasto.reacciones);
              }
        }
        destinos={destinosPosibles(datos.historial(), viaje.codigo)}
        prepararMover={async (gasto, codigo) => {
          try {
            const alli = await datos.abrirOtroViaje(codigo);
            if (alli.cerrado) return { error: t("{viaje} está cerrado.", { viaje: alli.nombre }) };
            const { gasto: pasado, error } = pasarGasto(gasto, { deAqui: viajeros, monedaAqui: viaje.moneda ?? "EUR" }, alli);
            return error ? { error } : { alli, pasado };
          } catch (fallo) {
            return { error: fallo.message };
          }
        }}
        onMover={(gasto, alli, pasado) => hacer(() => datos.moverGasto(gasto, alli, pasado))}
        onAnadirVarios={(lista) =>
          hacer(async () => {
            for (const gasto of lista) propios.current.add((await datos.anadirGasto(viaje.id, gasto, soy)).id);
          })
        }
        onQuitarVarios={(quitados) =>
          borrarConAviso(
            quitados.map((g) => g.id),
            queSeVaConGastos(quitados, viaje.moneda ?? "EUR"),
            () => Promise.all(quitados.map((g) => datos.quitarGasto(g.id, fotosDeGasto(g))))
          )
        }
        onQuitar={(id, concepto, fotos) =>
          borrarConAviso(id, `"${concepto}"`, () => datos.quitarGasto(id, fotos))
        }
        onAnadirFoto={(gasto, archivo) => hacer(async () => datos.anadirFoto(viaje.id, gasto, await reducirFoto(archivo)))}
        onQuitarFoto={(gasto, ruta) => hacer(() => datos.quitarFoto(gasto, ruta))}
        verTicket={datos.urlDelTicket}
      />

      {cerrado && (
        <CifrasViaje
          gastos={gastos}
          balances={balances}
          nombre={viaje.nombre}
          moneda={viaje.moneda ?? "EUR"}
          anterior={viaje.anterior}
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
          onSaldar={(pago) => hacer(() => datos.marcarSaldado(viaje.id, pago, soy))}
          onSaldarVarios={(pagos) => hacer(() => datos.marcarVariosSaldados(viaje.id, pagos, soy))}
          onDesaldar={(pago) => hacer(() => datos.desmarcarSaldado(viaje.id, pago))}
          onConfirmar={(pago) => hacer(() => datos.confirmarSaldado(viaje.id, pago))}
          cerrado={cerrado}
          soloVer={soloVer}
          onPresupuesto={(cantidad) => hacer(() => datos.ponerPresupuesto(viaje.id, cantidad))}
          onTopes={(topes) => hacer(() => datos.ponerTopes(viaje.id, topes))}
          onRedondear={(redondear) => hacer(() => datos.ponerRedondeo(viaje.id, redondear))}
          onCentro={(centro) => hacer(() => datos.ponerCentro(viaje.id, centro))}
          parciales={parciales}
          aportaciones={aportaciones}
          onParcial={(parcial) => hacer(() => datos.anadirParcial(viaje.id, parcial))}
          onQuitarParcial={(parcial, de, a) =>
            borrarConAviso(parcial.id, t("el pago de {de} a {a}", { de, a }), () => datos.quitarParcial(parcial.id))
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

      <Actividad actividad={viaje.actividad} viajeros={viajeros} soy={soy} monedaViaje={viaje.moneda ?? "EUR"} />

      {!soloVer && (viajeros.length > 0 || gastos.length > 0) && (
        <div className="botones-final">
          {!cerrado && gastos.length > 0 && (
            <button className="boton-cerrar-viaje" onClick={cerrarViaje}>
              🔒 {t("Cerrar el viaje")}
            </button>
          )}
          {/* Con uno solo no hay grupo que repetir. */}
          {viajeros.length > 1 && (
            <button className="boton-repetir-viaje" onClick={() => repetirViaje(viajeros)} disabled={repitiendo}>
              {repitiendo ? t("Creando…") : `🔁 ${t("Repetir con la misma gente")}`}
            </button>
          )}
          {!cerrado && (
            <button className="boton-reiniciar" onClick={vaciarViaje}>
              {t("Vaciar este viaje")}
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
          <span>{t("Has quitado {que}", { que: borrado.que })}</span>
          <button onClick={deshacerBorrado} title={t("También con Ctrl+Z (⌘Z en Mac)")}>
            {t("Deshacer")}
          </button>
        </div>
      )}

      {!borrado && editado?.viajeId === viaje.id && (
        <div className="deshacer">
          <span>{editado.texto}</span>
          <button onClick={deshacerEditado} title={t("También con Ctrl+Z (⌘Z en Mac)")}>
            {t("Deshacer")}
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
      {t("Instalar en el móvil")}
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
        <strong>{t("¿Habéis vuelto ya?")}</strong>{" "}
        {t("Hace {n} días que nadie apunta nada. Cerrado, los gastos ya no cambian.", { n: dias })}
      </p>
      <div className="sugerir-cerrar-botones">
        <button className="enlace" onClick={onCerrar}>
          {t("Cerrar")}
        </button>
        <button className="enlace aun-no" onClick={aunNo}>
          {t("Aún no")}
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
    <button className="boton-arriba" onClick={subir} aria-label={t("Volver arriba")} title={t("Volver arriba")}>
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
      <span>{t("Sin cuentas ni contraseñas")}</span>
      <span className="pie-punto">·</span>
      <span>{t("Solo entra quien tiene el código")}</span>
      <span className="pie-firma">
        {t("Hecho por Sergio Cayetano")} ·{" "}
        <a
          className="pie-enlace"
          href="https://github.com/SergioCayetano232/SaldoCero"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Código en GitHub")}
        </a>
      </span>
      <BotonTema />
      <BotonIdioma />
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

  useEffect(() => {
    function alPulsar(e) {
      if (!esAtajoTema(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      const nuevo = siguienteTema(tema);
      setTema(nuevo);
      datos.guardarTema(nuevo);
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [tema]);

  const { icono, nombre } = temaDe(tema);

  return (
    <button className="pie-tema" onClick={cambiar} title={t("Cambiar el tema")} aria-keyshortcuts="t">
      <span aria-hidden="true">{icono}</span> {t("Tema: {nombre}", { nombre: t(nombre).toLowerCase() })}
    </button>
  );
}

// Dice el idioma al que pasas, escrito en ese idioma: quien no lee el de ahora lo encuentra.
function BotonIdioma() {
  const otro = IDIOMAS.find((i) => i.id === otroIdioma());

  function cambiar() {
    usarIdioma(otro.id);
    guardarIdioma(otro.id);
  }

  return (
    <button className="pie-tema" onClick={cambiar} lang={otro.id}>
      <span aria-hidden="true">🌐</span> {otro.nombre}
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
      <p>{t("Repartimos los gastos del viaje entre todos.")}</p>
    </header>
  );
}

export default App;
