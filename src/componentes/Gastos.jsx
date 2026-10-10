import { useState, useEffect, useRef } from "react";
import { calcularTotal, importeDeGasto, participantesDeGasto } from "../calculos";
import { MONEDAS, cambio, conMoneda, leerTasa, monedaDelSiguiente, tasaComoTexto } from "../monedas";
import { CATEGORIAS, POR_DEFECTO, categoriaDe } from "../categorias";
import { filtrarGastos, hayFiltros, MINIMO_PARA_FILTRAR, SIN_FILTROS, soloDe } from "../filtros";
import { hoy, comoTitulo, porDias, diasRapidos, cuantosGastos } from "../fechas";
import { sugerirConceptos } from "../sugerencias";
import { adivinarCategoria } from "../adivinar";
import { ordenarGastos, ORDENES, POR_DIAS } from "../ordenar";
import { conPropina, PROPINAS } from "../propina";
import { borradorQueVale, hayAlgoEscrito, hayAlgoQueBorrar } from "../borrador";
import * as datos from "../datos";
import { gastoAlFormulario, repetirGasto } from "../repetir";
import { leerImporte, loQueFalta, cuadra, importesAPartes, partesAImportes } from "../importes";
import { BOTE } from "../bote";
import { esImagen } from "../tickets";
import { LARGO_NOTA, quedanEnNota } from "../notas";
import { cuentaDe, textoCuentaDe, textoParteDe } from "../loDeUno";
import { posiblesRepetidos } from "../repetidos";
import { leerSuma, esSuma } from "../sumas";
import { pagadorPorDefecto } from "../pagador";
import { pareceRaro } from "../raros";
import { DURA_EL_AVISO, textoAlGuardar } from "../apuntado";
import { esAtajoBuscar, esAtajoNuevo, esOrdenador } from "../teclado";
import Deslizable from "./Deslizable";
import VisorTicket from "./VisorTicket";

function Gastos({
  codigo,
  viajeros,
  colores,
  hayBote = false,
  gastos,
  monedaViaje,
  recienLlegados,
  cerrado,
  onAnadir,
  onEditar,
  onQuitar,
  verTicket,
  soy = null,
  verDe = null,
}) {
  // Lo que dejaste a medias la última vez, si lo hay.
  const [borrador] = useState(() => borradorQueVale(datos.leerBorrador(codigo), Date.now(), viajeros));
  const [recuperado, setRecuperado] = useState(Boolean(borrador));
  const porDefecto = pagadorPorDefecto(soy, viajeros);
  const [pagadorId, setPagadorId] = useState(borrador?.pagadorId || porDefecto);
  // Si dices quién eres con el formulario a estrenar, te pone de pagador ahí mismo.
  const [porDefectoAntes, setPorDefectoAntes] = useState(porDefecto);
  if (porDefecto !== porDefectoAntes) {
    setPorDefectoAntes(porDefecto);
    if (pagadorId === "") setPagadorId(porDefecto);
  }
  const [importe, setImporte] = useState(borrador?.importe ?? "");
  const [moneda, setMoneda] = useState(() =>
    MONEDAS.some((m) => m.codigo === borrador?.moneda) ? borrador.moneda : monedaViaje
  );
  const [concepto, setConcepto] = useState(borrador?.concepto ?? "");
  const [categoria, setCategoria] = useState(borrador?.categoria || POR_DEFECTO);
  // Mientras no la elijas tú, la categoría sigue a lo que escribes en el concepto.
  const [categoriaAMano, setCategoriaAMano] = useState(borrador?.categoriaAMano ?? false);
  // La nota va escondida hasta que la pides: casi ningún gasto la lleva.
  const [nota, setNota] = useState(borrador?.nota ?? "");
  const [notaAbierta, setNotaAbierta] = useState(Boolean(borrador?.nota));
  // Las partes de cada uno. Vacío = a partes iguales, que es lo normal.
  const [partes, setPartes] = useState({});
  const [repartoAbierto, setRepartoAbierto] = useState(false);
  // O lo que pone cada uno, tal cual se escribe, en la moneda en que se pagó.
  const [porImportes, setPorImportes] = useState(false);
  const [importes, setImportes] = useState({});
  // Por defecto hoy, que es cuando se apunta casi todo.
  const [fecha, setFecha] = useState(() => borrador?.fecha || hoy());
  // El cambio que nos ha dado la API, con la moneda a la que corresponde.
  // Así sabemos si lo que tenemos guardado sirve para la moneda de ahora.
  const [cambioTraido, setCambioTraido] = useState(null);
  // El cambio escrito a mano, tal cual. null = vale el de la API.
  const [tasaAMano, setTasaAMano] = useState(null);
  // Con la que empieza el formulario en blanco: la del último gasto que apuntaste.
  const [siguiente, setSiguiente] = useState({ moneda: monedaViaje, tasaAMano: null });

  // Si la API no lo sabe, no queda otra que escribirlo.
  const sinCambio = cambioTraido?.moneda === moneda && cambioTraido.tasa === null;
  const aMano = tasaAMano !== null || sinCambio;

  // En la moneda del viaje, uno por uno. Si no, lo escrito o lo que diga la API,
  // y undefined mientras está de camino.
  const tasa =
    moneda === monedaViaje
      ? 1
      : aMano
        ? leerTasa(tasaAMano)
        : cambioTraido?.moneda === moneda
          ? cambioTraido.tasa
          : undefined;
  // Lo escrito puede ser una suma ("12,5+8"): esto es ya el número. NaN si no se entiende.
  const importeLeido = leerSuma(importe) ?? NaN;
  const campoImporte = useRef(null);
  const campoPagador = useRef(null);
  // La propina puesta y el importe de antes, para quitarla o cambiarla sin que se acumulen.
  const [propina, setPropina] = useState(null);

  function escribirImporte(texto) {
    setImporte(texto);
    setPropina(null);
  }

  function alternarPropina(porcentaje) {
    const sin = propina?.sin ?? importe;
    if (propina?.porcentaje === porcentaje) {
      escribirImporte(sin);
      return;
    }

    const con = conPropina(sin, porcentaje);
    if (!con) return;
    setImporte(con);
    setPropina({ porcentaje, sin });
  }

  function otroSumando() {
    setPropina(null);
    setImporte(`${importe.trim()}+`);
    campoImporte.current?.focus();
  }

  // La foto nueva que has elegido, la que ya tenía el gasto que editas, y si la quitas.
  const [foto, setFoto] = useState(null);
  const [ticketActual, setTicketActual] = useState(null);
  const [quitarFoto, setQuitarFoto] = useState(false);
  // El gasto cuyo ticket estás mirando.
  const [viendo, setViendo] = useState(null);
  // Entre quiénes se reparte. null = no lo has tocado, así que van todos.
  const [participantes, setParticipantes] = useState(null);
  // El gasto que estás tocando ahora mismo. Vacío si estás apuntando uno nuevo.
  const [editando, setEditando] = useState(null);
  // El gasto que se parece al que ibas a apuntar, con lo que tenías escrito.
  const [repetido, setRepetido] = useState(null);
  const [raro, setRaro] = useState(null);
  const formulario = useRef(null);
  // Lo que se acaba de guardar, mientras el botón lo cuenta.
  const [hecho, setHecho] = useState(null);
  const relojHecho = useRef(null);

  useEffect(() => () => clearTimeout(relojHecho.current), []);

  function avisarHecho(como) {
    clearTimeout(relojHecho.current);
    setHecho(como);
    relojHecho.current = setTimeout(() => setHecho(null), DURA_EL_AVISO);
  }

  // Cada cambio en un gasto nuevo se guarda en el móvil. Al editar no: ese ya está guardado.
  useEffect(() => {
    if (editando) return;

    const ahora = { pagadorId, importe, moneda, concepto, categoria, categoriaAMano, nota, fecha };
    datos.guardarBorrador(codigo, hayAlgoEscrito(ahora) ? { ...ahora, guardadoEn: Date.now() } : null);
  }, [codigo, editando, pagadorId, importe, moneda, concepto, categoria, categoriaAMano, nota, fecha]);

  // Escape deja la edición, esté donde esté el foco. Pero si hay un visor abierto
  // o estás en otro campo (el presupuesto, un nombre), ese Escape es para ellos.
  useEffect(() => {
    if (!editando) return;

    function alPulsar(e) {
      if (e.key !== "Escape") return;
      if (document.querySelector('[aria-modal="true"]')) return;
      const enOtroCampo = e.target.closest?.("input, textarea, select") && !formulario.current?.contains(e.target);
      if (!enOtroCampo) cancelar();
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  });

  // Cada vez que cambias de moneda, preguntamos a cuánto está.
  useEffect(() => {
    if (moneda === monedaViaje) return;

    let vigente = true;

    cambio(moneda, monedaViaje).then((tasa) => {
      if (vigente) setCambioTraido({ moneda, tasa });
    });

    return () => {
      vigente = false;
    };
  }, [moneda, monedaViaje]);

  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [orden, setOrden] = useState(POR_DIAS);
  const [verDeAntes, setVerDeAntes] = useState(verDe);
  if (verDe !== verDeAntes) {
    setVerDeAntes(verDe);
    if (verDe) setFiltros(soloDe(verDe.id));
  }
  const barraFiltros = useRef(null);

  useEffect(() => {
    if (!verDe) return;
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    barraFiltros.current?.scrollIntoView({ behavior: quieto ? "auto" : "smooth", block: "start" });
  }, [verDe]);
  // Si quedan pocos gastos la barra se esconde, y con ella lo que hubiera filtrado.
  const puedeFiltrar = gastos.length >= MINIMO_PARA_FILTRAR;
  const filtrando = puedeFiltrar && hayFiltros(filtros);
  const visibles = filtrando ? filtrarGastos(gastos, filtros, viajeros) : gastos;
  // Solo las categorías que hay, que elegir una vacía no sirve de nada.
  const categoriasUsadas = CATEGORIAS.filter((c) =>
    gastos.some((g) => (g.categoria ?? POR_DEFECTO) === c.id)
  );

  // Filtrando por alguien, cada gasto dice lo que le toca a esa persona.
  const deQuien = filtrando ? viajeros.find((v) => v.id === filtros.viajeroId) : null;
  const esYo = Boolean(deQuien) && deQuien.id === soy;
  const puedoVerLoMio = viajeros.some((v) => v.id === soy);

  const buscador = useRef(null);

  useEffect(() => {
    if (!puedeFiltrar) return;

    function alPulsar(e) {
      if (!esAtajoBuscar(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      // Si no, la "/" se escribe dentro al coger el foco.
      e.preventDefault();
      buscador.current?.focus();
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [puedeFiltrar]);

  useEffect(() => {
    if (cerrado) return;

    function alPulsar(e) {
      if (!esAtajoNuevo(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      // Si ya sabe quién eres, el pagador viene puesto y se va directo al importe.
      const campo = pagadorId ? campoImporte.current : campoPagador.current;
      campo?.focus();
      campo?.scrollIntoView({ block: "center" });
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [cerrado, pagadorId]);

  function filtrar(cambio) {
    setFiltros({ ...filtros, ...cambio });
  }

  const sugerencias = sugerirConceptos(gastos, concepto);

  function usarSugerencia(s) {
    setConcepto(s.concepto);
    elegirCategoria(s.categoria);
  }

  function elegirCategoria(id) {
    setCategoria(id);
    setCategoriaAMano(true);
  }

  function escribirConcepto(texto) {
    setConcepto(texto);
    if (!categoriaAMano) setCategoria(adivinarCategoria(texto) ?? POR_DEFECTO);
  }

  // Los gastos agrupados por día, que es como se leen mejor. Ordenados de otra
  // forma van todos seguidos, en un solo grupo que no lleva título.
  const ordenVigente = puedeFiltrar ? orden : POR_DIAS;
  const dias =
    ordenVigente === POR_DIAS
      ? porDias(visibles)
      : [{ fecha: "", gastos: ordenarGastos(visibles, ordenVigente, viajeros) }];

  const todosLosIds = viajeros.map((v) => v.id);
  // Mientras no toques las casillas, el gasto va entre todos.
  const marcados = participantes ?? todosLosIds;
  const entreTodos = marcados.length === viajeros.length;

  function alternar(id) {
    const nuevos = marcados.includes(id)
      ? marcados.filter((otro) => otro !== id)
      : [...marcados, id];

    setParticipantes(nuevos);
  }

  function limpiar(queda = siguiente) {
    setRecuperado(false);
    escribirImporte("");
    setMoneda(queda.moneda);
    setTasaAMano(queda.tasaAMano);
    setConcepto("");
    setCategoria(POR_DEFECTO);
    setCategoriaAMano(false);
    setNota("");
    setNotaAbierta(false);
    setPartes({});
    setRepartoAbierto(false);
    setPorImportes(false);
    setImportes({});
    setFecha(hoy());
    setParticipantes(null);
    setEditando(null);
    setFoto(null);
    setTicketActual(null);
    setQuitarFoto(false);
    setRepetido(null);
    setRaro(null);
  }

  function rellenar(f) {
    setPagadorId(f.pagadorId);
    escribirImporte(f.importe);
    setMoneda(f.moneda);
    setTasaAMano(f.tasaAMano);
    setConcepto(f.concepto);
    // La que trae el gasto se respeta, aunque luego retoques el concepto.
    elegirCategoria(f.categoria);
    setNota(f.nota);
    setNotaAbierta(Boolean(f.nota));
    setFecha(f.fecha ?? hoy());
    setParticipantes(f.participantes);
    setPartes(f.partes);
    setPorImportes(f.porImportes);
    setImportes(f.importes);
    setRepartoAbierto(f.repartoAbierto);

    // En el móvil el formulario suele quedar arriba, fuera de la vista.
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    formulario.current?.scrollIntoView({ behavior: quieto ? "auto" : "smooth", block: "start" });
  }

  function editar(gasto) {
    setEditando(gasto.id);
    rellenar(gastoAlFormulario(gasto, viajeros, monedaViaje));
    setFoto(null);
    setTicketActual(gasto.ticket ?? null);
    setQuitarFoto(false);
  }

  function elegirFoto(e) {
    const archivo = e.target.files?.[0];
    // Que se pueda volver a elegir la misma si la quitas.
    e.target.value = "";
    if (esImagen(archivo)) setFoto(archivo);
  }

  // Otro igual pero de hoy: el desayuno de cada día, la gasolina...
  // No se guarda solo, que lo normal es que cambie algo del importe.
  function repetir(gasto) {
    setEditando(null);
    rellenar(repetirGasto(gasto, viajeros, monedaViaje, hoy()));
    // El ticket es de aquel día, no de este.
    setFoto(null);
    setTicketActual(null);
    setQuitarFoto(false);
  }

  // Lo que le toca a cada uno de los marcados. Por defecto, una parte.
  function partesDeLosMarcados() {
    return Object.fromEntries(marcados.map((id) => [id, partes[id] ?? 1]));
  }

  function cambiarParte(id, valor) {
    const numero = parseFloat(valor);
    setPartes({ ...partes, [id]: isNaN(numero) || numero < 0 ? 0 : numero });
  }

  // Para no empezar de cero: lo que les salía con las partes de ahora.
  function pasarAImportes() {
    setImportes(partesAImportes(partesDeLosMarcados(), marcados, importeLeido));
    setPorImportes(true);
  }

  const importeEscrito = importeLeido;
  const conImportes = repartoAbierto && porImportes;
  const falta = conImportes && importeEscrito > 0 ? loQueFalta(importes, marcados, importeEscrito) : null;
  const descuadrado = conImportes && !cuadra(importes, marcados, importeEscrito);

  // Cuánto sale para cada uno con las partes de ahora, para irlo viendo.
  function loQueLeToca(id) {
    const total = importeLeido;
    if (isNaN(total) || total <= 0 || typeof tasa !== "number") return null;
    // Por importes ya se ve, solo hace falta si hay que pasarlo de moneda.
    if (conImportes) return leerImporte(importes[id]) * tasa;

    const suyas = partesDeLosMarcados();
    const suma = Object.values(suyas).reduce((t, p) => t + p, 0);
    if (suma <= 0) return null;

    return ((total * tasa) * (suyas[id] ?? 0)) / suma;
  }

  // Si cambias el importe, el día o la moneda, la pregunta ya no viene a cuento.
  const avisoRepetido =
    repetido && repetido.importe === importe && repetido.fecha === fecha && repetido.moneda === moneda
      ? repetido.gasto
      : null;
  const avisoRaro = raro && raro.importe === importe && raro.moneda === moneda ? raro : null;

  function guardar(aunqueSeParezca = false, aunqueSeaMucho = false) {
    const importeNumero = importeLeido;

    if (pagadorId === "") return;
    if (isNaN(importeNumero) || importeNumero <= 0) return;
    if (marcados.length === 0) return;

    // Sin cambio no podemos convertir, así que no dejamos guardarlo a medias.
    if (typeof tasa !== "number") return;
    if (descuadrado) return;

    const gasto = {
      pagadorId,
      importe: importeNumero,
      moneda,
      // Lo guardamos ya convertido: si mañana cambia el cambio, este viaje no.
      importeConvertido: Number((importeNumero * tasa).toFixed(2)),
      concepto: concepto.trim() === "" ? "Gasto" : concepto.trim(),
      categoria,
      fecha,
      nota,
      participantes: marcados,
      // Solo mandamos las partes si de verdad hay reparto desigual.
      partes: !repartoAbierto
        ? null
        : conImportes
          ? importesAPartes(importes, marcados)
          : partesDeLosMarcados(),
      foto,
      quitarFoto: quitarFoto && !foto,
      ticketAnterior: ticketActual,
    };

    // Solo al apuntar uno nuevo: al editar, ya sabes cuál estás tocando.
    if (!editando && !aunqueSeaMucho && pareceRaro(gasto.importeConvertido, gastos)) {
      setRaro({ importe, moneda, convertido: gasto.importeConvertido });
      return;
    }

    if (!editando && !aunqueSeParezca) {
      const [parecido] = posiblesRepetidos(gasto, gastos);
      if (parecido) {
        setRepetido({ gasto: parecido, importe, fecha, moneda });
        return;
      }
    }

    const como = editando ? "editado" : "anadido";
    let guardando;
    if (editando) {
      guardando = onEditar(editando, gasto);
      // Terminada la edición, el formulario vuelve a estar en blanco.
      setPagadorId(porDefecto);
    } else {
      // Dejamos el pagador puesto por si encadena varios gastos.
      guardando = onAnadir(gasto);
    }
    // Solo si ha ido bien: si falla, ya sale el error arriba.
    Promise.resolve(guardando).then((bien) => bien && avisarHecho(como));

    const queda = monedaDelSiguiente(siguiente, { moneda, tasaAMano }, Boolean(editando));
    setSiguiente(queda);
    limpiar(queda);
    // Para ir encadenando gastos sin tocar el ratón.
    if (como === "anadido" && esOrdenador()) campoImporte.current?.focus({ preventScroll: true });
  }

  function cancelar() {
    setPagadorId(porDefecto);
    limpiar();
  }

  // Lo que se gastó ese día, en la moneda del viaje.
  function totalDelDia(dia) {
    return dia.gastos.reduce((t, g) => t + (g.importeConvertido ?? g.importe), 0);
  }

  function nombrePagador(id) {
    if (id === BOTE) return "🫙 Del bote";
    const viajero = viajeros.find((v) => v.id === id);
    return viajero ? viajero.nombre : "¿?";
  }

  // "cena · entre Ana y Luis", para saber de un vistazo cómo se repartió.
  function textoReparto(gasto) {
    const suyos = participantesDeGasto(gasto, viajeros);
    // Puede quedarse sin nadie si borras a los que iban en él.
    if (suyos.length === 0) return "sin nadie a quien repartirlo";
    // Si va repartido desigual, se dice: si no, engaña ver "entre todos".
    const desigual = Object.values(gasto.partes ?? {}).some((p) => p !== 1);
    const comoSeParte = desigual ? ", a partes distintas" : "";

    if (suyos.length === viajeros.length) return `entre todos${comoSeParte}`;

    return `entre ${suyos.map((v) => v.nombre).join(", ")}${comoSeParte}`;
  }

  return (
    <section className="tarjeta">
      <h2>
        <span className="icono">🧾</span> Gastos
        {gastos.length > 0 && <span className="titulo-cuantos">{gastos.length}</span>}
      </h2>

      {viajeros.length === 0 ? (
        <p className="vacio">Primero añade viajeros para poder registrar gastos.</p>
      ) : (
        <>
          {/* Cerrado, ya no se apuntan gastos. */}
          {!cerrado && (
            <div className="formulario-gasto" ref={formulario}>
              {recuperado && (
                <p className="borrador-recuperado" role="status">
                  ✍️ Lo dejaste a medias.
                  <button className="enlace" onClick={cancelar}>
                    Descartar
                  </button>
                </p>
              )}

              <select
                ref={campoPagador}
                value={pagadorId}
                onChange={(e) => setPagadorId(e.target.value)}
              >
                <option value="">¿Quién pagó?</option>
                {viajeros.map((viajero) => (
                  <option key={viajero.id} value={viajero.id}>
                    {viajero.nombre}
                  </option>
                ))}
                {/* Si editas uno del bote, que siga saliendo aunque ya no haya bote. */}
                {(hayBote || pagadorId === BOTE) && <option value={BOTE}>🫙 Del bote</option>}
              </select>

              <div className="fila-importe">
                {/* De texto y no number, que si no el "+" no se deja escribir. El
                    teclado sigue siendo el de números. */}
                <div className={`campo-suma ${esSuma(importe) ? "con-suma" : ""}`}>
                  <input
                    ref={campoImporte}
                    type="text"
                    inputMode="decimal"
                    // "Importe" no cabía en el móvil; la moneda ya va al lado.
                    placeholder="0,00"
                    aria-label="Importe"
                    aria-keyshortcuts="N"
                    title={esOrdenador() ? "Importe (pulsa N para venir aquí)" : undefined}
                    enterKeyHint="done"
                    value={importe}
                    // Para corregirlo escribes encima, sin borrar antes.
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => escribirImporte(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") guardar();
                    }}
                  />
                  {/* El teclado del móvil no trae "+": va aquí. */}
                  {importeLeido > 0 && !importe.trim().endsWith("+") && (
                    <button
                      className="boton-sumar"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={otroSumando}
                      title="Sumarle otro importe"
                      aria-label="Sumarle otro importe"
                    >
                      +
                    </button>
                  )}
                </div>
                <select
                  className="selector-moneda"
                  value={moneda}
                  onChange={(e) => {
                    setMoneda(e.target.value);
                    setTasaAMano(null);
                  }}
                  title="¿En qué moneda se pagó?"
                >
                  {MONEDAS.map((m) => (
                    <option key={m.codigo} value={m.codigo}>
                      {m.codigo}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  className="campo-fecha"
                  value={fecha}
                  max={hoy()}
                  onChange={(e) => setFecha(e.target.value || hoy())}
                  title="¿Qué día fue?"
                />
              </div>

              <div className="dias-rapidos">
                {diasRapidos().map((d) => (
                  <button
                    key={d.nombre}
                    className="pastilla-interruptor"
                    onClick={() => setFecha(d.fecha)}
                    aria-pressed={fecha === d.fecha}
                  >
                    {d.nombre}
                  </button>
                ))}
              </div>

              {/* Solo en lo de comer, que es donde se deja. */}
              {categoria === "comida" && importeLeido > 0 && (
                <div className="propinas">
                  <span>Propina</span>
                  {PROPINAS.map((p) => (
                    <button
                      key={p}
                      className="pastilla-interruptor"
                      onClick={() => alternarPropina(p)}
                      aria-pressed={propina?.porcentaje === p}
                    >
                      +{p} %
                    </button>
                  ))}
                </div>
              )}

              {esSuma(importe) && (
                <p className={`resultado-suma ${isNaN(importeLeido) ? "suma-mal" : ""}`} role="status">
                  {isNaN(importeLeido)
                    ? "Esa suma no se entiende: solo números y +"
                    : `= ${conMoneda(importeLeido, moneda)}`}
                </p>
              )}

              {moneda !== monedaViaje && (
                <div className="conversion">
                  {aMano ? (
                    <>
                      {sinCambio && tasaAMano === null && (
                        <span className="aviso">No sabemos el cambio de {moneda}, ponlo tú. </span>
                      )}
                      <label className="cambio-a-mano">
                        1 {moneda} =
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={tasaAMano ?? ""}
                          onChange={(e) => setTasaAMano(e.target.value)}
                          aria-label={`Cuántos ${monedaViaje} es 1 ${moneda}`}
                        />
                        {monedaViaje}
                      </label>
                      {tasa && importeLeido > 0 && (
                        <> · Son <strong>{conMoneda(importeLeido * tasa, monedaViaje)}</strong></>
                      )}
                      {typeof cambioTraido?.tasa === "number" && cambioTraido.moneda === moneda && (
                        <button className="enlace" onClick={() => setTasaAMano(null)}>
                          Usar el del día
                        </button>
                      )}
                    </>
                  ) : tasa === undefined ? (
                    <>Mirando a cuánto está el cambio…</>
                  ) : (
                    <>
                      {importeLeido > 0 && (
                        <>Son <strong>{conMoneda(importeLeido * tasa, monedaViaje)}</strong> · </>
                      )}
                      1 {moneda} = {tasa.toFixed(4)} {monedaViaje}
                      {/* El banco no siempre te cobra el del día. */}
                      <button className="enlace" onClick={() => setTasaAMano(tasaComoTexto(tasa))}>
                        Cambiar
                      </button>
                    </>
                  )}
                </div>
              )}

              <input
                type="text"
                placeholder="Concepto (cena, hotel...)"
                autoCapitalize="sentences"
                enterKeyHint="done"
                value={concepto}
                onChange={(e) => escribirConcepto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") guardar();
                }}
              />

              <div className="fila-ticket">
                {foto ? (
                  <span className="ticket-elegido">
                    📷 <span className="ticket-nombre">{foto.name}</span>
                    <button className="boton-quitar" onClick={() => setFoto(null)} aria-label="No poner esta foto">
                      ✕
                    </button>
                  </span>
                ) : ticketActual && !quitarFoto ? (
                  <span className="ticket-elegido">
                    <button className="enlace" onClick={() => setViendo({ ticket: ticketActual, concepto })}>
                      🧾 Tiene foto
                    </button>
                    <label className="enlace">
                      Cambiar
                      <input type="file" accept="image/*" onChange={elegirFoto} hidden />
                    </label>
                    <button className="enlace" onClick={() => setQuitarFoto(true)}>
                      Quitar
                    </button>
                  </span>
                ) : (
                  <label className="boton-foto">
                    📷 {quitarFoto ? "Se quitará la foto · poner otra" : "Foto del ticket"}
                    <input type="file" accept="image/*" onChange={elegirFoto} hidden />
                  </label>
                )}

                {!notaAbierta && (
                  <button className="boton-foto" onClick={() => setNotaAbierta(true)}>
                    📝 Nota
                  </button>
                )}
              </div>

              {notaAbierta && (
                <>
                  <input
                    type="text"
                    className="campo-nota"
                    placeholder="Nota (incluye la propina...)"
                    enterKeyHint="done"
                    maxLength={LARGO_NOTA}
                    value={nota}
                    // Solo si la acabas de abrir tú, no al subir un gasto para editarlo.
                    autoFocus={!editando}
                    onChange={(e) => setNota(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") guardar();
                    }}
                  />
                  {quedanEnNota(nota) !== null && (
                    <small className={`nota-quedan ${quedanEnNota(nota) === 0 ? "tope" : ""}`} aria-live="polite">
                      {quedanEnNota(nota) === 0 ? "No cabe más" : `Quedan ${quedanEnNota(nota)} letras`}
                    </small>
                  )}
                </>
              )}

              {sugerencias.length > 0 && (
                <div className="sugerencias">
                  {sugerencias.map((s) => {
                    const c = categoriaDe(s.categoria);
                    return (
                      <button
                        key={s.concepto}
                        className="pastilla-categoria sugerencia"
                        onClick={() => usarSugerencia(s)}
                        style={{ "--color-categoria": c.color }}
                      >
                        <span className="pastilla-emoji">{c.emoji}</span>
                        {s.concepto}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* En qué se fue. Van como pastillas y no en un desplegable:
                  se ven todas a la vez y se elige de un toque. */}
              <div className="categorias">
                {CATEGORIAS.map((c) => (
                  <button
                    key={c.id}
                    className={`pastilla-categoria ${categoria === c.id ? "elegida" : ""}`}
                    onClick={() => elegirCategoria(c.id)}
                    title={c.nombre}
                    style={{ "--color-categoria": c.color }}
                  >
                    <span className="pastilla-emoji">{c.emoji}</span>
                    {c.nombre}
                  </button>
                ))}
              </div>

              <div className="participantes">
                <p className="participantes-titulo">
                  {marcados.length === 0 ? (
                    <span className="aviso">Marca al menos a uno para repartir el gasto</span>
                  ) : (
                    <>
                      Se reparte entre{" "}
                      {entreTodos ? <strong>todos</strong> : <strong>{marcados.length}</strong>}
                    </>
                  )}
                  {!entreTodos && (
                    <button className="enlace" onClick={() => setParticipantes(todosLosIds)}>
                      marcar todos
                    </button>
                  )}
                </p>

                <div className="casillas">
                  {viajeros.map((viajero) => (
                    <label
                      key={viajero.id}
                      className="casilla"
                      style={{ "--color-viajero": colores?.get(viajero.nombre) }}
                    >
                      <input
                        type="checkbox"
                        checked={marcados.includes(viajero.id)}
                        onChange={() => alternar(viajero.id)}
                      />
                      {viajero.nombre}
                    </label>
                  ))}
                </div>

                {/* El reparto desigual va escondido: la mayoría de gastos se
                    parten por igual y no hace falta marear con esto. */}
                {marcados.length > 1 && (
                  <button
                    className="enlace enlace-reparto"
                    onClick={() => setRepartoAbierto(!repartoAbierto)}
                  >
                    {repartoAbierto ? "← volver a partes iguales" : "¿unos más que otros?"}
                  </button>
                )}

                {repartoAbierto && marcados.length > 1 && (
                  <div className="partes">
                    <div className="modo-reparto">
                      <button
                        className={porImportes ? "" : "activo"}
                        onClick={() => setPorImportes(false)}
                      >
                        Por partes
                      </button>
                      <button
                        className={porImportes ? "activo" : ""}
                        onClick={() => !porImportes && pasarAImportes()}
                      >
                        Por importe
                      </button>
                    </div>

                    <p className="partes-ayuda">
                      {porImportes
                        ? `Lo que pone cada uno, en ${moneda}. Tiene que sumar el importe.`
                        : "Cuántas partes paga cada uno. Con 2 y 1, el primero paga el doble."}
                    </p>

                    {viajeros
                      .filter((v) => marcados.includes(v.id))
                      .map((viajero) => {
                        const suyo = loQueLeToca(viajero.id);

                        return (
                          <div className="fila-parte" key={viajero.id}>
                            <span className="parte-nombre">{viajero.nombre}</span>

                            {porImportes ? (
                              <input
                                type="number"
                                className="parte-campo campo-importe"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={importes[viajero.id] ?? ""}
                                onChange={(e) =>
                                  setImportes({ ...importes, [viajero.id]: e.target.value })
                                }
                              />
                            ) : (
                              <input
                                type="number"
                                className="parte-campo"
                                min="0"
                                step="0.5"
                                value={partes[viajero.id] ?? 1}
                                onChange={(e) => cambiarParte(viajero.id, e.target.value)}
                              />
                            )}

                            {/* Por importes en la moneda del viaje, la cifra ya está escrita. */}
                            {suyo !== null && !(porImportes && moneda === monedaViaje) && (
                              <span className="parte-importe">
                                {conMoneda(suyo, monedaViaje)}
                              </span>
                            )}
                          </div>
                        );
                      })}

                    {falta !== null && (
                      <p className={`cuadre ${falta === 0 ? "cuadre-bien" : "cuadre-mal"}`}>
                        {falta === 0
                          ? "✓ Cuadra con el importe"
                          : falta > 0
                            ? `Faltan ${conMoneda(falta, moneda)} por repartir`
                            : `Sobran ${conMoneda(-falta, moneda)}`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {editando ? (
                <div className="fila-botones">
                  <button onClick={() => guardar()} disabled={marcados.length === 0 || typeof tasa !== "number" || descuadrado}>
                    Guardar cambios
                  </button>
                  <button className="boton-cancelar" onClick={cancelar}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  {avisoRaro && (
                    <div className="aviso-repetido" role="alert">
                      <p>
                        🤔 <strong>{conMoneda(avisoRaro.convertido, monedaViaje)}</strong> es mucho más de lo que
                        se suele gastar en este viaje. ¿Está bien?
                      </p>
                      <div className="aviso-repetido-botones">
                        <button className="aviso-si" onClick={() => guardar(false, true)}>
                          Sí, está bien
                        </button>
                        <button
                          className="aviso-no"
                          onClick={() => {
                            setRaro(null);
                            campoImporte.current?.focus();
                          }}
                        >
                          Corregir
                        </button>
                      </div>
                    </div>
                  )}

                  {avisoRepetido && (
                    <div className="aviso-repetido" role="alert">
                      <p>
                        🤔 {avisoRepetido.pagadorId === BOTE ? "Del bote ya salió" : `${nombrePagador(avisoRepetido.pagadorId)} ya apuntó`}{" "}
                        <strong>{avisoRepetido.concepto}</strong> de{" "}
                        <strong>{conMoneda(importeDeGasto(avisoRepetido), monedaViaje)}</strong> ese mismo día.
                        ¿Es otro gasto?
                      </p>
                      <div className="aviso-repetido-botones">
                        <button className="aviso-si" onClick={() => guardar(true, true)}>
                          Sí, apuntarlo
                        </button>
                        <button className="aviso-no" onClick={cancelar}>
                          No, ya estaba
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Con el aviso de lo que dejaste a medias ya está su Descartar. */}
                  {!recuperado &&
                    hayAlgoQueBorrar({ importe, concepto, nota, foto, participantes, repartoAbierto, fecha }, hoy()) && (
                      <p className="borrar-escrito">
                        <button className="enlace" onClick={cancelar}>
                          Borrar lo escrito
                        </button>
                      </p>
                    )}

                  <button
                    key={hecho ?? "nada"}
                    className={hecho ? "hecho" : ""}
                    onClick={() => guardar()}
                    disabled={marcados.length === 0 || typeof tasa !== "number" || descuadrado || Boolean(avisoRepetido) || Boolean(avisoRaro)}
                  >
                    {textoAlGuardar(hecho)}
                  </button>
                </>
              )}
            </div>
          )}

          {puedeFiltrar && (
            <div className="filtros" ref={barraFiltros}>
              <div className="filtro-fila">
                <input
                  type="search"
                  className="filtro-buscar"
                  ref={buscador}
                  // El atajo solo se cuenta donde hay teclado.
                  placeholder={esOrdenador() ? "Buscar un gasto (pulsa /)" : "Buscar un gasto"}
                  aria-keyshortcuts="/"
                  aria-label="Buscar un gasto"
                  enterKeyHint="search"
                  value={filtros.texto}
                  onChange={(e) => filtrar({ texto: e.target.value })}
                  // En el móvil, el teclado tapa justo los resultados.
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.target.blur();
                  }}
                />

                {puedoVerLoMio && (
                  <button
                    className={`filtro-mio ${esYo ? "activo" : ""}`}
                    onClick={() => filtrar({ viajeroId: esYo ? "" : soy })}
                    aria-pressed={esYo}
                  >
                    Solo lo mío
                  </button>
                )}
              </div>

              <div className="filtro-selectores">
                <select
                  value={filtros.viajeroId}
                  onChange={(e) => filtrar({ viajeroId: e.target.value })}
                  aria-label="Filtrar por persona"
                >
                  <option value="">Todos</option>
                  {viajeros.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={filtros.categoria}
                  onChange={(e) => filtrar({ categoria: e.target.value })}
                  aria-label="Filtrar por categoría"
                >
                  <option value="">Todo</option>
                  {categoriasUsadas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.nombre}
                    </option>
                  ))}
                </select>

                <select
                  className="filtro-orden"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  aria-label="Ordenar gastos"
                >
                  {ORDENES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {filtrando && (
                <p className="filtro-resumen" role="status">
                  <span>
                    {visibles.length} de {gastos.length} gastos · suman{" "}
                    <strong>{conMoneda(calcularTotal(visibles), monedaViaje)}</strong>
                    {deQuien && (
                      <span className="filtro-cuenta">
                        {textoCuentaDe(cuentaDe(visibles, deQuien.id, viajeros), deQuien.nombre, esYo, monedaViaje)}
                      </span>
                    )}
                  </span>
                  <button className="enlace" onClick={() => setFiltros(SIN_FILTROS)}>
                    quitar filtros
                  </button>
                </p>
              )}
            </div>
          )}

          {gastos.length === 0 ? (
            <p className="vacio">Todavía no hay gastos.</p>
          ) : visibles.length === 0 ? (
            <p className="vacio">Ningún gasto encaja con eso.</p>
          ) : (
            dias.map((dia) => (
              <div className="dia" key={dia.fecha || "sin-fecha"}>
                {/* El día solo se pone si el viaje dura más de uno. */}
                {dias.length > 1 && (
                  <p className="dia-titulo">
                    <span>
                      {dia.fecha ? comoTitulo(dia.fecha) : "Sin fecha"}
                      <span className="dia-cuantos"> · {cuantosGastos(dia.gastos.length)}</span>
                    </span>
                    <span className="dia-total">
                      {conMoneda(totalDelDia(dia), monedaViaje)}
                    </span>
                  </p>
                )}

                <ul className="lista lista-deslizable">
                  {dia.gastos.map((gasto) => (
                    <Deslizable
                      key={gasto.id}
                      className={`${gasto.id === editando ? "editandose" : ""} ${
                        recienLlegados?.has(gasto.id) ? "recien-llegado" : ""
                      }`}
                      onEditar={() => editar(gasto)}
                      onQuitar={() => onQuitar(gasto.id, gasto.concepto, gasto.ticket)}
                      quieto={cerrado}
                    >
                      <span
                        className="gasto-icono"
                        title={categoriaDe(gasto.categoria).nombre}
                      >
                        {categoriaDe(gasto.categoria).emoji}
                      </span>

                      <span>
                        <span className="gasto-concepto">{gasto.concepto}</span>
                        {gasto.ticket && (
                          <button
                            className="boton-ticket"
                            onClick={() => setViendo(gasto)}
                            title="Ver el ticket"
                            aria-label={`Ver el ticket de ${gasto.concepto}`}
                          >
                            🧾
                          </button>
                        )}
                        <br />
                        <small className="reparto">
                          {nombrePagador(gasto.pagadorId)} · {textoReparto(gasto)}
                          {/* Sin los títulos de los días, la fecha va en cada uno. */}
                          {ordenVigente !== POR_DIAS && gasto.fecha && ` · ${comoTitulo(gasto.fecha)}`}
                        </small>
                        {deQuien && (
                          <small className="gasto-parte">
                            {textoParteDe(gasto, deQuien.id, viajeros, esYo, monedaViaje)}
                          </small>
                        )}
                        {gasto.nota && <small className="gasto-nota">{gasto.nota}</small>}
                      </span>

                      <span className="gasto-importe">
                        {conMoneda(gasto.importe, gasto.moneda ?? monedaViaje)}
                        {gasto.moneda && gasto.moneda !== monedaViaje && (
                          <small className="gasto-convertido">
                            {conMoneda(gasto.importeConvertido, monedaViaje)}
                          </small>
                        )}
                      </span>

                      {!cerrado && (
                        <span className="acciones">
                          <button
                            className="boton-repetir"
                            onClick={() => repetir(gasto)}
                            title="Apuntar otro igual"
                            aria-label="Apuntar otro igual"
                          >
                            ⧉
                          </button>
                          <button
                            className="boton-editar"
                            onClick={() => editar(gasto)}
                            title="Editar gasto"
                          >
                            ✏️
                          </button>
                          <button
                            className="boton-quitar"
                            onClick={() => onQuitar(gasto.id, gasto.concepto, gasto.ticket)}
                          >
                            ✕
                          </button>
                        </span>
                      )}
                    </Deslizable>
                  ))}
                </ul>
              </div>
            ))
          )}
        </>
      )}

      {viendo && (
        <VisorTicket
          ruta={viendo.ticket}
          concepto={viendo.concepto}
          cargar={verTicket}
          onCerrar={() => setViendo(null)}
        />
      )}
    </section>
  );
}

export default Gastos;
