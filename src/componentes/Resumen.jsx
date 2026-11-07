import { useEffect, useRef, useState } from "react";
import {
  balancesTrasPagos,
  calcularLeTocaPagar,
  estadoDeBalance,
  calcularPagos,
  calcularTotal,
  mediaPorGasto,
  gastoMasCaro,
  marcarSaldados,
  quedaPorPagar,
  redondearPagos,
  hayCentimos,
} from "../calculos";
import { cambio, conMoneda, monedaDeCasa } from "../monedas";
import { hayQuePasarACasa, textoACasa, textoCambioACasa } from "../enCasa";
import { resumenEnTexto, copiarAlPortapapeles, descargarResumen, descargarGastos, invitar, enlaceDelViaje, compartirImagen, nombreDeArchivo } from "../compartir";
import { datosDeTarjeta } from "../tarjeta";
import { tarjetaEnImagen } from "../pintarTarjeta";
import { hayDiagrama } from "../diagrama";
import DiagramaDeudas from "./DiagramaDeudas";
import { gastosEnCSV } from "../exportar";
import { juntarBalances, pagaYo, cobroYo } from "../juntos";
import Topes from "./Topes";
import { mensajeDeCobro, enlaceWhatsApp } from "../cobrar";
import { cobroDe, cobroComoTexto, cantidadParaPegar } from "../cobro";
import { BOTE, sinBote } from "../bote";
import { gastoPorCategoria } from "../categorias";
import { importeDeGasto, parteDe, ordenarPorSaldo } from "../calculos";
import { cifrasDelViaje, cifrasEnTexto } from "../cifras";
import Cifra from "./Cifra";
import Confeti from "./Confeti";
import Avatar from "./Avatar";
import Desglose from "./Desglose";
import PorLugar from "./PorLugar";
import PorDias from "./PorDias";
import Evolucion from "./Evolucion";
import PagosACuenta from "./PagosACuenta";
import { cuantosPago, textoPagados } from "../pagados";
import Presupuesto from "./Presupuesto";
import { porCabezaYDia } from "../presupuesto";
import { gastadoHoy, frenteAAyer, miParteDeHoy, textoFrenteAAyer } from "../loDeHoy";
import { esElUltimo, sonLosUltimos } from "../confeti";
import { deudoresConVarias } from "../deGolpe";
import { porcentajes } from "../donut";
import { vibrar } from "../vibrar";
import { miSaldo, textoMiSaldo, estadoMiSaldo } from "../miSaldo";
import { esAtajoBajarResumen, esAtajoCompartir, esAtajoExcel, esAtajoCuentas, esOrdenador } from "../teclado";
import { t, tn } from "../idioma";

function Resumen({
  balances,
  colores,
  gastos,
  monedaViaje = "EUR",
  saldados = [],
  parciales = [],
  aportaciones = [],
  onSaldar,
  onSaldarVarios,
  onDesaldar,
  onParcial,
  onQuitarParcial,
  onRedondear,
  onPresupuesto,
  onTopes,
  cerrado,
  viaje,
  soy,
  onVerGastos,
  onVerDia,
  onVerGasto,
}) {
  // "" mientras no has copiado, y si no, lo que ha pasado.
  const [copiado, setCopiado] = useState("");
  // "haciendo" mientras se pinta, que en un móvil lento tarda un momento.
  const [imagen, setImagen] = useState("");
  // Qué fiesta va. Hace de key para que el confeti vuelva a caer si se repite.
  const [fiesta, setFiesta] = useState(null);
  const fiestas = useRef(0);
  const zonaSaldar = useRef(null);
  // De qué pago acabas de copiar el Bizum, para decírtelo un momento.
  const [cobroCopiado, setCobroCopiado] = useState(null);
  // Y lo mismo con la cifra, que es lo otro que hay que escribir en el Bizum.
  const [cantidadCopiada, setCantidadCopiada] = useState(null);
  // El cambio a la moneda de casa, con la moneda del viaje a la que corresponde.
  const [casa] = useState(monedaDeCasa);
  const [cambioACasa, setCambioACasa] = useState(null);
  // De quién es el desglose. null = del viaje entero.
  const [persona, setPersona] = useState(null);
  useEffect(() => {
    if (!hayQuePasarACasa(monedaViaje, casa)) return;
    let sigue = true;
    // Sin internet o sin cambio sale null, y las deudas se quedan como estaban.
    cambio(monedaViaje, casa).then((tasa) => sigue && setCambioACasa({ moneda: monedaViaje, tasa }));
    return () => {
      sigue = false;
    };
  }, [monedaViaje, casa]);

  const total = calcularTotal(gastos);
  const media = mediaPorGasto(gastos);
  const masCaro = gastoMasCaro(gastos);
  // El bote entra en los pagos (lo que sobra se devuelve), pero no es nadie:
  // ni le toca pagar la próxima ni sale en las listas de personas.
  const personas = sinBote(balances);
  const alDia = porCabezaYDia(gastos, personas.length);
  const deHoy = gastadoHoy(gastos);
  const comoAyer = textoFrenteAAyer(frenteAAyer(gastos), monedaViaje);
  const miParte = personas.some((v) => v.id === soy) ? miParteDeHoy(gastos, soy, personas) : null;
  const exactos = calcularPagos(juntarBalances(balances));
  const redondear = viaje?.redondear === true;
  const pagos = marcarSaldados(redondear ? redondearPagos(exactos) : exactos, saldados);
  const deGolpe = deudoresConVarias(pagos);
  // Encendido se queda a la vista aunque ya no haya céntimos, para poder apagarlo.
  const verRedondeo = redondear || hayCentimos(exactos);
  // Con lo ya pagado descontado: si todo está saldado, no le toca a nadie.
  const leTocaPagar = calcularLeTocaPagar(balancesTrasPagos(personas, pagos));
  const pendiente = quedaPorPagar(pagos);
  const delViaje = gastoPorCategoria(gastos, importeDeGasto);
  // Si lo han quitado del viaje mientras lo mirabas, vuelve a todos.
  const deQuien = personas.find((v) => v.id === persona);
  // Lo que le tocaba a él de cada gasto, no lo que pagó: eso es en qué se le fue.
  const porCategoria = deQuien
    ? gastoPorCategoria(gastos, (g) => parteDe(g, deQuien.id, personas))
    : delViaje;
  const todoPagado = pagos.length > 0 && pendiente === 0;
  const tasaACasa = cambioACasa?.moneda === monedaViaje ? cambioACasa.tasa : null;
  // Si se ha ido del viaje, ya no hay saldo suyo que enseñar.
  const loMio = personas.some((v) => v.id === soy) ? miSaldo(pagos, soy) : null;

  // Las barras se miden contra el que más ha puesto.
  const maxPuesto = Math.max(...personas.map((v) => v.puesto), 0);
  // Si solo ha pagado uno, su 100 % no cuenta nada que no se vea ya.
  const enOrden = ordenarPorSaldo(personas);
  // En el orden de la lista, que el porcentaje va por posición.
  const tantoPuesto = porcentajes(enOrden.map((v) => v.puesto));
  const variosPusieron = personas.filter((v) => v.puesto > 0).length > 1;

  useEffect(() => {
    function alPulsar(e) {
      if (!esAtajoCuentas(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      zonaSaldar.current?.scrollIntoView({ block: "start" });
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  const botonCompartir = useRef(null);
  useEffect(() => {
    function alPulsar(e) {
      if (!esAtajoCompartir(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      botonCompartir.current?.click();
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  const botonGuardar = useRef(null);
  useEffect(() => {
    function alPulsar(e) {
      if (!esAtajoBajarResumen(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      botonGuardar.current?.click();
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  const botonExcel = useRef(null);
  useEffect(() => {
    function alPulsar(e) {
      if (!esAtajoExcel(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      botonExcel.current?.click();
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  function elResumen(conCifras = false) {
    const nombre = viaje?.nombre ?? "El viaje";
    const conBote = personas.map((v) => ({ ...v, puesto: v.puesto + (v.alBote ?? 0) }));
    const cifras = conCifras && cerrado ? cifrasDelViaje(gastos, conBote, monedaViaje) : null;

    return resumenEnTexto({
      nombre,
      codigo: viaje?.codigo ?? "",
      total,
      // En "lo que puso cada uno" cuenta también lo que metió en el bote.
      balances: conBote,
      pagos,
      moneda: monedaViaje,
      cifras: cifras ? cifrasEnTexto(cifras, nombre, monedaViaje) : "",
      gastos,
      enlace: viaje?.codigo ? enlaceDelViaje(viaje.codigo) : null,
    });
  }

  async function saldar(pago) {
    const ultimo = esElUltimo(pagos, pago);
    const bien = await onSaldar(pago);
    // Solo si se ha guardado: celebrarlo y que luego falle queda fatal.
    if (ultimo && bien) celebrar();
  }

  async function saldarTodoDe(deudor) {
    const ultimos = sonLosUltimos(pagos, deudor.pagos);
    const bien = await onSaldarVarios(deudor.pagos);
    if (ultimos && bien) celebrar();
  }

  function celebrar() {
    const esta = ++fiestas.current;
    setFiesta(esta);
    vibrar("exito");
    setTimeout(() => setFiesta((f) => (f === esta ? null : f)), 3500);
  }

  // Lo que se pega en el banco va sin espacios.
  async function copiarCobro(pago, cobro) {
    const clave = `${pago.deId}-${pago.aId}`;
    const hecho = await copiarAlPortapapeles(cobro.valor);
    setCobroCopiado(hecho ? clave : null);
    setTimeout(() => setCobroCopiado((c) => (c === clave ? null : c)), 2000);
  }

  async function copiarCantidad(pago) {
    const clave = `${pago.deId}-${pago.aId}`;
    const hecho = await copiarAlPortapapeles(cantidadParaPegar(pago.cantidad));
    setCantidadCopiada(hecho ? clave : null);
    setTimeout(() => setCantidadCopiada((c) => (c === clave ? null : c)), 2000);
  }

  function cobroDeQuienCobra(pago) {
    return cobroDe(personas.find((v) => v.id === pago.aId));
  }

  // En el móvil sale su menú y lo mandas directo al grupo. Si no hay, se copia.
  async function compartir() {
    const como = await invitar({ text: elResumen() });
    if (como !== "copiado" && como !== "fallo") return;

    setCopiado(como === "copiado" ? "bien" : "mal");
    setTimeout(() => setCopiado(""), 2500);
  }

  async function mandarImagen() {
    setImagen("haciendo");
    const nombre = viaje?.nombre ?? "El viaje";
    try {
      const datos = datosDeTarjeta({ nombre, total, personas, pagos, moneda: monedaViaje, gastos });
      const png = await tarjetaEnImagen(datos, colores, `Apuntado con SaldoCero · ${window.location.host}`);
      await compartirImagen(png, nombreDeArchivo(nombre, "png"));
      setImagen("");
    } catch (fallo) {
      console.error("No hemos podido hacer la imagen.", fallo);
      setImagen("mal");
      setTimeout(() => setImagen(""), 2500);
    }
  }

  return (
    <section className="tarjeta">
      <h2>
        <span className="icono">📊</span> {t("Resumen")}
        <span className="acciones-resumen">
          <button
            className="boton-compartir"
            ref={botonCompartir}
            onClick={compartir}
            title={esOrdenador() ? t("Compartir el resumen (también con la S)") : t("Compartir el resumen")}
            aria-keyshortcuts="s"
          >
            {copiado === "bien" ? t("¡Copiado!") : copiado === "mal" ? t("No se pudo") : t("Compartir")}
          </button>

          <button
            className="boton-compartir"
            onClick={mandarImagen}
            disabled={imagen === "haciendo"}
            title={t("Mandar quién paga a quién en una imagen")}
          >
            {imagen === "haciendo" ? t("Haciendo…") : imagen === "mal" ? t("No se pudo") : t("Imagen")}
          </button>

          <button
            className="boton-compartir"
            ref={botonGuardar}
            onClick={() => descargarResumen(elResumen(true), viaje?.nombre ?? "viaje")}
            title={esOrdenador() ? t("Bajarlo en un archivo (también con la G)") : t("Bajarlo en un archivo")}
            aria-keyshortcuts="g"
          >
            {t("Guardar")}
          </button>

          <button
            className="boton-compartir"
            onClick={() =>
              descargarGastos(
                gastosEnCSV({ gastos, viajeros: personas, moneda: monedaViaje, nombre: viaje?.nombre, pagos }),
                viaje?.nombre ?? "viaje"
              )
            }
            ref={botonExcel}
            title={esOrdenador() ? t("Bajar los gastos en una hoja de cálculo (también con la E)") : t("Bajar los gastos en una hoja de cálculo")}
            aria-keyshortcuts="e"
          >
            {t("Excel")}
          </button>
        </span>
      </h2>

      <div className="total-destacado">
        <div className="total-etiqueta">{t("Total del viaje")}</div>
        {/* La que cuenta no se anuncia: el lector iría cantando cada número
            de la cuenta. Se lee la de al lado, que ya es la final. */}
        <div className="total-cifra">
          <span aria-hidden="true">
            <Cifra valor={total} moneda={monedaViaje} />
          </span>
          <span className="solo-lector" aria-live="polite">
            {conMoneda(total, monedaViaje)}
          </span>
        </div>
        <div className="total-detalle">
          {tn(gastos.length, "{n} gasto", "{n} gastos")} · {tn(personas.length, "{n} viajero", "{n} viajeros")}
          {media !== null && (
            <> · <span className="sin-partir">{t("{cifra} de media", { cifra: conMoneda(media, monedaViaje) })}</span></>
          )}
        </div>
        {masCaro && (
          <div className="total-detalle">
            {t("El más caro:")}{" "}
            <button className="total-mas-caro" onClick={() => onVerGasto?.(masCaro.id)} title={t("Verlo en la lista")}>
              {masCaro.concepto}
            </button>
            ,{" "}
            <span className="sin-partir">{conMoneda(importeDeGasto(masCaro), monedaViaje)}</span>
          </div>
        )}
        {alDia !== null && (
          <div className="total-detalle">{t("Sale a {cifra} por cabeza y día", { cifra: conMoneda(alDia, monedaViaje) })}</div>
        )}
        {deHoy && (
          <div className="total-detalle">
            {tn(deHoy.gastos, "Hoy lleváis {cifra} en {n} gasto", "Hoy lleváis {cifra} en {n} gastos", { cifra: conMoneda(deHoy.total, monedaViaje) })}
            {comoAyer && <span className="sin-partir">, {comoAyer}</span>}
            {miParte && <>. <span className="sin-partir">{t("Te tocan {cifra}", { cifra: conMoneda(miParte, monedaViaje) })}</span></>}
          </div>
        )}
        {loMio && gastos.length > 0 && (
          <div className={`mi-saldo ${estadoMiSaldo(loMio)}`} aria-live="polite">{textoMiSaldo(loMio, monedaViaje)}</div>
        )}
        <Presupuesto
          total={total}
          gastos={gastos}
          presupuesto={viaje?.presupuesto ?? null}
          moneda={monedaViaje}
          cuantos={personas.length}
          fijo={cerrado}
          onGuardar={onPresupuesto}
        />
      </div>

      {/* En qué se ha ido el dinero. Solo si hay más de una cosa, que si no
          es un anillo entero y no cuenta nada. */}
      {delViaje.length > 1 && (
        <>
          {personas.length > 1 && (
            <div className="desglose-quien" role="group" aria-label={t("De quién")}>
              <button
                className={`pastilla-categoria ${deQuien ? "" : "elegida"}`}
                style={{ "--color-categoria": "var(--teal-500)" }}
                onClick={() => setPersona(null)}
              >
                {t("Todos")}
              </button>
              {personas.map((v) => (
                <button
                  key={v.id}
                  className={`pastilla-categoria ${v.id === deQuien?.id ? "elegida" : ""}`}
                  style={{ "--color-categoria": colores?.get(v.nombre) ?? "var(--tinta-tenue)" }}
                  onClick={() => setPersona(v.id)}
                >
                  <span className="desglose-punto" style={{ backgroundColor: "var(--color-categoria)" }} />
                  {v.nombre}
                  {v.id === soy && <span className="etiqueta-tu">{t("tú")}</span>}
                </button>
              ))}
            </div>
          )}

          {deQuien && porCategoria.length > 0 && (
            <p className="desglose-de">
              {t("A {nombre} le tocan", { nombre: deQuien.nombre })}{" "}
              <strong>{conMoneda(deQuien.tocaPagar, monedaViaje)}</strong>{" "}
              {t("de los {total}", { total: conMoneda(total, monedaViaje) })}
            </p>
          )}

          {porCategoria.length > 0 ? (
            // Con key, el donut vuelve a dibujarse al cambiar de persona.
            <Desglose key={persona ?? "todos"} porCategoria={porCategoria} moneda={monedaViaje} />
          ) : (
            <p className="vacio">{t("{nombre} no va en ningún gasto.", { nombre: deQuien.nombre })}</p>
          )}
        </>
      )}

      <PorLugar gastos={gastos} moneda={monedaViaje} />

      <Topes gastos={gastos} topes={viaje?.topes ?? {}} moneda={monedaViaje} fijo={cerrado} onGuardar={onTopes} />

      <PorDias gastos={gastos} moneda={monedaViaje} onVerDia={onVerDia} />

      <Evolucion
        viajeros={personas}
        gastos={gastos}
        aportaciones={aportaciones}
        colores={colores}
        moneda={monedaViaje}
        soy={soy}
      />

      {/* Cerrado ya no hay "próxima" que pagar. */}
      {leTocaPagar && !cerrado && (
        <div className="le-toca">
          {leTocaPagar.igualados ? (
            <>✅ {t("Está todo igualado, puede pagar cualquiera.")}</>
          ) : (
            <>
              👉 {leTocaPagar.id === soy ? (
                <strong>{t("Te toca pagar a ti")}</strong>
              ) : (
                <>
                  {t("Le toca pagar a")} <strong>{leTocaPagar.nombre}</strong>
                </>
              )}
            </>
          )}
        </div>
      )}

      <ul className="lista">
        {enOrden.map((viajero, i) => {
          const estado = estadoDeBalance(viajero.balance);
          const pagados = textoPagados(cuantosPago(gastos, viajero.id));

          return (
            <li
              key={viajero.id}
              className={`fila-balance ${estado} ${
                viajero.id === soy ? "soy-yo" : ""
              }`}
            >
              <Avatar
                nombre={viajero.nombre}
                color={colores?.get(viajero.nombre)}
                latiendo={leTocaPagar && !leTocaPagar.igualados && leTocaPagar.nombre === viajero.nombre}
              />

              <div className="balance-quien">
                <div className="balance-nombre">
                  {onVerGastos ? (
                    <button
                      className="balance-ver"
                      onClick={() => onVerGastos(viajero.id)}
                      title={t("Ver los gastos de {nombre}", { nombre: viajero.nombre })}
                    >
                      {viajero.nombre}
                      <span className="balance-ver-flecha" aria-hidden="true">›</span>
                    </button>
                  ) : (
                    viajero.nombre
                  )}
                  {viajero.id === soy && <span className="etiqueta-tu">{t("tú")}</span>}
                </div>
                <div className="barra">
                  <div
                    className="barra-relleno"
                    style={{ width: maxPuesto > 0 ? `${(viajero.puesto / maxPuesto) * 100}%` : "0%" }}
                  />
                </div>
                <small className="reparto">
                  <span className="sin-partir">
                    {t("puso {cifra}", { cifra: conMoneda(viajero.puesto, monedaViaje) })}
                    {variosPusieron && viajero.puesto > 0 && <span className="reparto-tanto"> ({tantoPuesto[i]} %)</span>}
                  </span>{" "}
                  {pagados && <span className="sin-partir">{pagados} </span>}
                  ·{" "}
                  <span className="sin-partir">{t("le tocan {cifra}", { cifra: conMoneda(viajero.tocaPagar, monedaViaje) })}</span>
                  {/* Si no, puso y le tocan no cuadran con lo que debe. */}
                  {viajero.dado > 0 && (
                    <> · <span className="sin-partir">{t("dio {cifra}", { cifra: conMoneda(viajero.dado, monedaViaje) })}</span></>
                  )}
                  {viajero.alBote > 0 && (
                    <> · <span className="sin-partir">{t("al bote {cifra}", { cifra: conMoneda(viajero.alBote, monedaViaje) })}</span></>
                  )}
                  {viajero.recibido > 0 && (
                    <> · <span className="sin-partir">{t("recibió {cifra}", { cifra: conMoneda(viajero.recibido, monedaViaje) })}</span></>
                  )}
                </small>
              </div>

              <div className="balance-cifra">
                <div className="balance-importe">
                  {estado === "le-deben" ? "+" : estado === "debe" ? "−" : ""}
                  <Cifra valor={Math.abs(viajero.balance)} moneda={monedaViaje} />
                </div>
                <div className="balance-texto">
                  {estado === "le-deben" ? t("le deben") : estado === "debe" ? t("debe") : t("en paz")}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="saldar" ref={zonaSaldar}>
        <h3>
          {t("Cómo saldar cuentas")}
          {pendiente > 0 && (
            <span className="pendiente">
              {t("quedan")} <Cifra valor={pendiente} moneda={monedaViaje} />
            </span>
          )}
        </h3>

        {pagos.length === 0 ? (
          <p className="saldadas">🎉 {t("Cuentas saldadas. Nadie debe nada.")}</p>
        ) : (
          <>
            {todoPagado && (
              <p className="saldadas">🎉 {t("Todo pagado. Ya estáis a cero.")}</p>
            )}

            {tasaACasa && pendiente > 0 && (
              <p className="en-casa">
                {t("En {casa}, al cambio de hoy ({cambio}).", { casa, cambio: textoCambioACasa(tasaACasa, monedaViaje, casa) })}
              </p>
            )}

            {hayDiagrama(pagos) && (
              <DiagramaDeudas pagos={pagos} colores={colores} moneda={monedaViaje} soy={soy} />
            )}

            {pagos.map((pago) => {
              const cobro = cobroDeQuienCobra(pago);

              return (
                <div
                  className={`pago ${pago.saldado ? "pagado" : ""} ${
                    pagaYo(pago, soy) || cobroYo(pago, soy) ? "pago-mio" : ""
                  }`}
                  key={`${pago.deId}-${pago.aId}`}
                >
                  <AvatarDe id={pago.deId} nombre={pago.de} colores={colores} />
                  <strong>{pago.deId === BOTE ? t("Bote") : pago.de}</strong>
                  <span className="pago-flecha">→</span>
                  <AvatarDe id={pago.aId} nombre={pago.a} colores={colores} />
                  <strong>{pago.aId === BOTE ? t("Bote") : pago.a}</strong>
                  <span className="pago-final">
                    {pago.saldado ? (
                      <span className="pago-cantidad">{conMoneda(pago.cantidad, monedaViaje)}</span>
                    ) : (
                      <button
                        className="pago-cantidad"
                        onClick={() => copiarCantidad(pago)}
                        title={t("Copiar la cifra")}
                      >
                        {cantidadCopiada === `${pago.deId}-${pago.aId}`
                          ? `✓ ${t("copiado")}`
                          : conMoneda(pago.cantidad, monedaViaje)}
                      </button>
                    )}

                    {!pago.saldado && tasaACasa && (
                      <span className="pago-en-casa">{textoACasa(pago.cantidad, tasaACasa, casa)}</span>
                    )}

                    {/* Al bote no se le manda un WhatsApp. */}
                    {!pago.saldado && pago.deId !== BOTE && pago.aId !== BOTE && (
                      <a
                        className="boton-saldar boton-cobrar"
                        href={enlaceWhatsApp(
                          mensajeDeCobro({
                            pago,
                            soy,
                            nombreViaje: viaje?.nombre ?? "el viaje",
                            codigo: viaje?.codigo,
                            moneda: monedaViaje,
                            cobro: cobro,
                          })
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t("Pedírselo a {nombre} por WhatsApp", { nombre: pago.de })}
                        aria-label={t("Pedírselo a {nombre} por WhatsApp", { nombre: pago.de })}
                      >
                        💬
                      </a>
                    )}

                    <button
                      className="boton-saldar"
                      onClick={() => (pago.saldado ? onDesaldar(pago) : saldar(pago))}
                      title={pago.saldado ? t("Marcar como pendiente") : t("Marcar como pagado")}
                    >
                      {pago.saldado ? "↩︎" : "✓"}
                    </button>
                  </span>

                  {!pago.saldado && cobro && (
                    <button
                      className="pago-cobro"
                      onClick={() => copiarCobro(pago, cobro)}
                      title={t("Copiar")}
                    >
                      <span className="pago-cobro-tipo">
                        {cobro.tipo === "bizum" ? "📲 Bizum" : "🏦 IBAN"}
                      </span>
                      <span className="pago-cobro-valor">
                        {cobroComoTexto(cobro)}
                      </span>
                      <span className="pago-cobro-copiar">
                        {cobroCopiado === `${pago.deId}-${pago.aId}` ? `✓ ${t("copiado")}` : t("copiar")}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {deGolpe.length > 0 && (
          <div className="de-golpe">
            {deGolpe.map((deudor) => (
              <button
                key={deudor.deId ?? deudor.de}
                className="pastilla-interruptor"
                onClick={() => saldarTodoDe(deudor)}
                title={t("Marcar como pagadas sus {n} deudas", { n: deudor.pagos.length })}
              >
                ✓ {pagaYo(deudor, soy) ? t("Lo he pagado todo") : t("{nombre} lo ha pagado todo", { nombre: deudor.de })} ·{" "}
                {conMoneda(deudor.cantidad, monedaViaje)}
              </button>
            ))}
          </div>
        )}

        {verRedondeo && (
          <button
            className="pastilla-interruptor boton-redondeo"
            onClick={() => onRedondear(!redondear)}
            aria-pressed={redondear}
            title={t("Para todo el viaje")}
          >
            {redondear ? `✓ ${t("Sin céntimos")}` : t("Quitar los céntimos")}
          </button>
        )}

        <PagosACuenta
          viajeros={personas}
          pagos={pagos.filter((p) => p.deId !== BOTE && p.aId !== BOTE)}
          parciales={parciales}
          colores={colores}
          moneda={monedaViaje}
          onAnadir={onParcial}
          onQuitar={onQuitarParcial}
        />
      </div>

      {fiesta && <Confeti key={fiesta} />}
    </section>
  );
}

function AvatarDe({ id, nombre, colores }) {
  if (id === BOTE) {
    return (
      <span className="avatar avatar-pequeno avatar-bote" aria-hidden="true">
        🫙
      </span>
    );
  }
  return <Avatar nombre={nombre} color={colores?.get(nombre)} pequeno />;
}

export default Resumen;
