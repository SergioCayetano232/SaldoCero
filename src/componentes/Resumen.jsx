import { useRef, useState } from "react";
import {
  balancesTrasPagos,
  calcularLeTocaPagar,
  estadoDeBalance,
  calcularPagos,
  calcularTotal,
  marcarSaldados,
  quedaPorPagar,
  redondearPagos,
  hayCentimos,
} from "../calculos";
import { conMoneda } from "../monedas";
import { resumenEnTexto, copiarAlPortapapeles, descargarResumen, descargarGastos, invitar } from "../compartir";
import { gastosEnCSV } from "../exportar";
import { mensajeDeCobro, enlaceWhatsApp } from "../cobrar";
import { cobroDe, cobroComoTexto, cantidadParaPegar } from "../cobro";
import { BOTE, sinBote } from "../bote";
import { gastoPorCategoria } from "../categorias";
import { importeDeGasto, parteDe } from "../calculos";
import Cifra from "./Cifra";
import Confeti from "./Confeti";
import Avatar from "./Avatar";
import Desglose from "./Desglose";
import PorDias from "./PorDias";
import PagosACuenta from "./PagosACuenta";
import Presupuesto from "./Presupuesto";
import { esElUltimo } from "../confeti";
import { vibrar } from "../vibrar";

function Resumen({
  balances,
  colores,
  gastos,
  monedaViaje = "EUR",
  saldados = [],
  parciales = [],
  onSaldar,
  onDesaldar,
  onParcial,
  onQuitarParcial,
  onRedondear,
  onPresupuesto,
  cerrado,
  viaje,
  soy,
}) {
  // "" mientras no has copiado, y si no, lo que ha pasado.
  const [copiado, setCopiado] = useState("");
  // Qué fiesta va. Hace de key para que el confeti vuelva a caer si se repite.
  const [fiesta, setFiesta] = useState(null);
  const fiestas = useRef(0);
  // De qué pago acabas de copiar el Bizum, para decírtelo un momento.
  const [cobroCopiado, setCobroCopiado] = useState(null);
  // Y lo mismo con la cifra, que es lo otro que hay que escribir en el Bizum.
  const [cantidadCopiada, setCantidadCopiada] = useState(null);
  // De quién es el desglose. null = del viaje entero.
  const [persona, setPersona] = useState(null);
  const total = calcularTotal(gastos);
  // El bote entra en los pagos (lo que sobra se devuelve), pero no es nadie:
  // ni le toca pagar la próxima ni sale en las listas de personas.
  const personas = sinBote(balances);
  const exactos = calcularPagos(balances);
  const redondear = viaje?.redondear === true;
  const pagos = marcarSaldados(redondear ? redondearPagos(exactos) : exactos, saldados);
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

  // Las barras se miden contra el que más ha puesto.
  const maxPuesto = Math.max(...personas.map((v) => v.puesto), 0);

  function elResumen() {
    return resumenEnTexto({
      nombre: viaje?.nombre ?? "El viaje",
      codigo: viaje?.codigo ?? "",
      total,
      // En "lo que puso cada uno" cuenta también lo que metió en el bote.
      balances: personas.map((v) => ({ ...v, puesto: v.puesto + (v.alBote ?? 0) })),
      pagos,
      moneda: monedaViaje,
    });
  }

  async function saldar(pago) {
    const ultimo = esElUltimo(pagos, pago);
    const bien = await onSaldar(pago);

    // Solo si se ha guardado: celebrarlo y que luego falle queda fatal.
    if (ultimo && bien) {
      const esta = ++fiestas.current;
      setFiesta(esta);
      vibrar("exito");
      setTimeout(() => setFiesta((f) => (f === esta ? null : f)), 3500);
    }
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

  return (
    <section className="tarjeta">
      <h2>
        <span className="icono">📊</span> Resumen
        <span className="acciones-resumen">
          <button
            className="boton-compartir"
            onClick={compartir}
            title="Compartir el resumen"
          >
            {copiado === "bien" ? "¡Copiado!" : copiado === "mal" ? "No se pudo" : "Compartir"}
          </button>

          <button
            className="boton-compartir"
            onClick={() => descargarResumen(elResumen(), viaje?.nombre ?? "viaje")}
            title="Bajarlo en un archivo"
          >
            Guardar
          </button>

          <button
            className="boton-compartir"
            onClick={() =>
              descargarGastos(
                gastosEnCSV({ gastos, viajeros: personas, moneda: monedaViaje }),
                viaje?.nombre ?? "viaje"
              )
            }
            title="Bajar los gastos en una hoja de cálculo"
          >
            Excel
          </button>
        </span>
      </h2>

      <div className="total-destacado">
        <div className="total-etiqueta">Total del viaje</div>
        <div className="total-cifra">
          <Cifra valor={total} moneda={monedaViaje} />
        </div>
        <div className="total-detalle">
          {gastos.length} {gastos.length === 1 ? "gasto" : "gastos"} · {personas.length}{" "}
          {personas.length === 1 ? "viajero" : "viajeros"}
        </div>
        <Presupuesto
          total={total}
          gastos={gastos}
          presupuesto={viaje?.presupuesto ?? null}
          moneda={monedaViaje}
          fijo={cerrado}
          onGuardar={onPresupuesto}
        />
      </div>

      {/* En qué se ha ido el dinero. Solo si hay más de una cosa, que si no
          es un anillo entero y no cuenta nada. */}
      {delViaje.length > 1 && (
        <>
          {personas.length > 1 && (
            <div className="desglose-quien" role="group" aria-label="De quién">
              <button
                className={`pastilla-categoria ${deQuien ? "" : "elegida"}`}
                style={{ "--color-categoria": "var(--teal-500)" }}
                onClick={() => setPersona(null)}
              >
                Todos
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
                  {v.id === soy && <span className="etiqueta-tu">tú</span>}
                </button>
              ))}
            </div>
          )}

          {deQuien && porCategoria.length > 0 && (
            <p className="desglose-de">
              A {deQuien.nombre} le tocan{" "}
              <strong>{conMoneda(deQuien.tocaPagar, monedaViaje)}</strong> de los{" "}
              {conMoneda(total, monedaViaje)}
            </p>
          )}

          {porCategoria.length > 0 ? (
            // Con key, el donut vuelve a dibujarse al cambiar de persona.
            <Desglose key={persona ?? "todos"} porCategoria={porCategoria} moneda={monedaViaje} />
          ) : (
            <p className="vacio">{deQuien.nombre} no va en ningún gasto.</p>
          )}
        </>
      )}

      <PorDias gastos={gastos} moneda={monedaViaje} />

      {/* Cerrado ya no hay "próxima" que pagar. */}
      {leTocaPagar && !cerrado && (
        <div className="le-toca">
          {leTocaPagar.igualados ? (
            <>✅ Está todo igualado, puede pagar cualquiera.</>
          ) : (
            <>
              👉 {leTocaPagar.id === soy ? "Te" : "Le"} toca pagar a{" "}
              <strong>{leTocaPagar.id === soy ? "ti" : leTocaPagar.nombre}</strong>
            </>
          )}
        </div>
      )}

      <ul className="lista">
        {personas.map((viajero) => {
          const estado = estadoDeBalance(viajero.balance);

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
                  {viajero.nombre}
                  {viajero.id === soy && <span className="etiqueta-tu">tú</span>}
                </div>
                <div className="barra">
                  <div
                    className="barra-relleno"
                    style={{ width: maxPuesto > 0 ? `${(viajero.puesto / maxPuesto) * 100}%` : "0%" }}
                  />
                </div>
                <small className="reparto">
                  <span className="sin-partir">puso {conMoneda(viajero.puesto, monedaViaje)}</span> ·{" "}
                  <span className="sin-partir">le tocan {conMoneda(viajero.tocaPagar, monedaViaje)}</span>
                  {/* Si no, puso y le tocan no cuadran con lo que debe. */}
                  {viajero.dado > 0 && (
                    <> · <span className="sin-partir">dio {conMoneda(viajero.dado, monedaViaje)}</span></>
                  )}
                  {viajero.alBote > 0 && (
                    <> · <span className="sin-partir">al bote {conMoneda(viajero.alBote, monedaViaje)}</span></>
                  )}
                  {viajero.recibido > 0 && (
                    <> · <span className="sin-partir">recibió {conMoneda(viajero.recibido, monedaViaje)}</span></>
                  )}
                </small>
              </div>

              <div className="balance-cifra">
                <div className="balance-importe">
                  {estado === "le-deben" ? "+" : estado === "debe" ? "−" : ""}
                  <Cifra valor={Math.abs(viajero.balance)} moneda={monedaViaje} />
                </div>
                <div className="balance-texto">
                  {estado === "le-deben" ? "le deben" : estado === "debe" ? "debe" : "en paz"}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="saldar">
        <h3>
          Cómo saldar cuentas
          {pendiente > 0 && (
            <span className="pendiente">
              quedan <Cifra valor={pendiente} moneda={monedaViaje} />
            </span>
          )}
        </h3>

        {pagos.length === 0 ? (
          <p className="saldadas">🎉 Cuentas saldadas. Nadie debe nada.</p>
        ) : (
          <>
            {todoPagado && (
              <p className="saldadas">🎉 Todo pagado. Ya estáis a cero.</p>
            )}

            {pagos.map((pago) => {
              const cobro = cobroDeQuienCobra(pago);

              return (
                <div
                  className={`pago ${pago.saldado ? "pagado" : ""} ${
                    soy && (pago.deId === soy || pago.aId === soy) ? "pago-mio" : ""
                  }`}
                  key={`${pago.deId}-${pago.aId}`}
                >
                  <AvatarDe id={pago.deId} nombre={pago.de} colores={colores} />
                  <strong>{pago.de}</strong>
                  <span className="pago-flecha">→</span>
                  <AvatarDe id={pago.aId} nombre={pago.a} colores={colores} />
                  <strong>{pago.a}</strong>
                  <span className="pago-final">
                    {pago.saldado ? (
                      <span className="pago-cantidad">{conMoneda(pago.cantidad, monedaViaje)}</span>
                    ) : (
                      <button
                        className="pago-cantidad"
                        onClick={() => copiarCantidad(pago)}
                        title="Copiar la cifra"
                      >
                        {cantidadCopiada === `${pago.deId}-${pago.aId}`
                          ? "✓ copiado"
                          : conMoneda(pago.cantidad, monedaViaje)}
                      </button>
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
                        title={`Pedírselo a ${pago.de} por WhatsApp`}
                        aria-label={`Pedírselo a ${pago.de} por WhatsApp`}
                      >
                        💬
                      </a>
                    )}

                    <button
                      className="boton-saldar"
                      onClick={() => (pago.saldado ? onDesaldar(pago) : saldar(pago))}
                      title={pago.saldado ? "Marcar como pendiente" : "Marcar como pagado"}
                    >
                      {pago.saldado ? "↩︎" : "✓"}
                    </button>
                  </span>

                  {!pago.saldado && cobro && (
                    <button
                      className="pago-cobro"
                      onClick={() => copiarCobro(pago, cobro)}
                      title="Copiar"
                    >
                      <span className="pago-cobro-tipo">
                        {cobro.tipo === "bizum" ? "📲 Bizum" : "🏦 IBAN"}
                      </span>
                      <span className="pago-cobro-valor">
                        {cobroComoTexto(cobro)}
                      </span>
                      <span className="pago-cobro-copiar">
                        {cobroCopiado === `${pago.deId}-${pago.aId}` ? "✓ copiado" : "copiar"}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {verRedondeo && (
          <button
            className="pastilla-interruptor boton-redondeo"
            onClick={() => onRedondear(!redondear)}
            aria-pressed={redondear}
            title="Para todo el viaje"
          >
            {redondear ? "✓ Sin céntimos" : "Quitar los céntimos"}
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
