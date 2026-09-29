import { useRef, useState } from "react";
import {
  calcularLeTocaPagar,
  estadoDeBalance,
  calcularPagos,
  calcularTotal,
  marcarSaldados,
  quedaPorPagar,
} from "../calculos";
import { conMoneda } from "../monedas";
import { resumenEnTexto, copiarAlPortapapeles, descargarResumen } from "../compartir";
import { gastoPorCategoria } from "../categorias";
import { importeDeGasto } from "../calculos";
import Cifra from "./Cifra";
import Confeti from "./Confeti";
import Avatar from "./Avatar";
import { esElUltimo } from "../confeti";

function Resumen({
  balances,
  colores,
  gastos,
  monedaViaje = "EUR",
  saldados = [],
  onSaldar,
  onDesaldar,
  viaje,
  soy,
}) {
  // "" mientras no has copiado, y si no, lo que ha pasado.
  const [copiado, setCopiado] = useState("");
  // Qué fiesta va. Hace de key para que el confeti vuelva a caer si se repite.
  const [fiesta, setFiesta] = useState(null);
  const fiestas = useRef(0);
  const total = calcularTotal(gastos);
  const leTocaPagar = calcularLeTocaPagar(balances);
  const pagos = marcarSaldados(calcularPagos(balances), saldados);
  const pendiente = quedaPorPagar(pagos);
  // Tu nombre, para saber cuáles de los pagos te tocan a ti.
  const miNombre = balances.find((v) => v.id === soy)?.nombre ?? null;
  const porCategoria = gastoPorCategoria(gastos, importeDeGasto);
  const todoPagado = pagos.length > 0 && pendiente === 0;

  // Las barras se miden contra el que más ha puesto.
  const maxPuesto = Math.max(...balances.map((v) => v.puesto), 0);

  function elResumen() {
    return resumenEnTexto({
      nombre: viaje?.nombre ?? "El viaje",
      codigo: viaje?.codigo ?? "",
      total,
      balances,
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
      setTimeout(() => setFiesta((f) => (f === esta ? null : f)), 3500);
    }
  }

  async function compartir() {
    const hecho = await copiarAlPortapapeles(elResumen());
    setCopiado(hecho ? "bien" : "mal");
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
            title="Copiar el resumen"
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
        </span>
      </h2>

      <div className="total-destacado">
        <div className="total-etiqueta">Total del viaje</div>
        <div className="total-cifra">
          <Cifra valor={total} moneda={monedaViaje} />
        </div>
        <div className="total-detalle">
          {gastos.length} {gastos.length === 1 ? "gasto" : "gastos"} · {balances.length}{" "}
          {balances.length === 1 ? "viajero" : "viajeros"}
        </div>
      </div>

      {/* En qué se ha ido el dinero. Solo si hay más de una cosa, que si no
          es una barra al 100% y no cuenta nada. */}
      {porCategoria.length > 1 && (
        <div className="desglose">
          <div className="desglose-barra">
            {porCategoria.map((c) => (
              <div
                key={c.id}
                className="desglose-trozo"
                style={{
                  width: `${(c.total / total) * 100}%`,
                  backgroundColor: c.color,
                }}
                title={`${c.nombre}: ${conMoneda(c.total, monedaViaje)}`}
              />
            ))}
          </div>

          <ul className="desglose-lista">
            {porCategoria.map((c) => (
              <li key={c.id}>
                <span className="desglose-punto" style={{ backgroundColor: c.color }} />
                {c.emoji} {c.nombre}
                <strong>{conMoneda(c.total, monedaViaje)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

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
        {balances.map((viajero) => {
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

            {pagos.map((pago) => (
              <div
                className={`pago ${pago.saldado ? "pagado" : ""} ${
                  pago.de === miNombre || pago.a === miNombre ? "pago-mio" : ""
                }`}
                key={`${pago.de}-${pago.a}`}
              >
                <Avatar nombre={pago.de} color={colores?.get(pago.de)} pequeno />
                <strong>{pago.de}</strong>
                <span className="pago-flecha">→</span>
                <Avatar nombre={pago.a} color={colores?.get(pago.a)} pequeno />
                <strong>{pago.a}</strong>
                <span className="pago-cantidad">
                  {conMoneda(pago.cantidad, monedaViaje)}
                </span>

                <button
                  className="boton-saldar"
                  onClick={() => (pago.saldado ? onDesaldar(pago) : saldar(pago))}
                  title={pago.saldado ? "Marcar como pendiente" : "Marcar como pagado"}
                >
                  {pago.saldado ? "↩︎" : "✓"}
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {fiesta && <Confeti key={fiesta} />}
    </section>
  );
}

export default Resumen;
