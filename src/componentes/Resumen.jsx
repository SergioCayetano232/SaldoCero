import {
  calcularLeTocaPagar,
  calcularPagos,
  calcularTotal,
  marcarSaldados,
  quedaPorPagar,
} from "../calculos";
import { conMoneda } from "../monedas";

function Resumen({
  balances,
  gastos,
  monedaViaje = "EUR",
  saldados = [],
  onSaldar,
  onDesaldar,
}) {
  const total = calcularTotal(gastos);
  const leTocaPagar = calcularLeTocaPagar(balances);
  const pagos = marcarSaldados(calcularPagos(balances), saldados);
  const pendiente = quedaPorPagar(pagos);
  const todoPagado = pagos.length > 0 && pendiente === 0;

  // Las barras se miden contra el que más ha puesto.
  const maxPuesto = Math.max(...balances.map((v) => v.puesto), 0);

  return (
    <section className="tarjeta">
      <h2><span className="icono">📊</span> Resumen</h2>

      <div className="total-destacado">
        <div className="total-etiqueta">Total del viaje</div>
        <div className="total-cifra">{conMoneda(total, monedaViaje)}</div>
        <div className="total-detalle">
          {gastos.length} {gastos.length === 1 ? "gasto" : "gastos"} · {balances.length}{" "}
          {balances.length === 1 ? "viajero" : "viajeros"}
        </div>
      </div>

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
          <li
            key={viajero.id}
            className={`fila-balance ${viajero.balance >= 0 ? "positivo" : "negativo"}`}
          >
            <div className="balance-quien">
              <div className="balance-nombre">{viajero.nombre}</div>
              <div className="barra">
                <div
                  className="barra-relleno"
                  style={{ width: maxPuesto > 0 ? `${(viajero.puesto / maxPuesto) * 100}%` : "0%" }}
                />
              </div>
              <small className="reparto">
                puso {conMoneda(viajero.puesto, monedaViaje)} · le tocan{" "}
                {conMoneda(viajero.tocaPagar, monedaViaje)}
              </small>
            </div>

            <div className="balance-cifra">
              <div className="balance-importe">
                {viajero.balance >= 0 ? "+" : "−"}
                {conMoneda(Math.abs(viajero.balance), monedaViaje)}
              </div>
              <div className="balance-texto">
                {viajero.balance >= 0 ? "le deben" : "debe"}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="saldar">
        <h3>
          Cómo saldar cuentas
          {pendiente > 0 && (
            <span className="pendiente">
              quedan {conMoneda(pendiente, monedaViaje)}
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
                className={`pago ${pago.saldado ? "pagado" : ""}`}
                key={`${pago.de}-${pago.a}`}
              >
                <strong>{pago.de}</strong>
                <span className="pago-flecha">→</span>
                <strong>{pago.a}</strong>
                <span className="pago-cantidad">
                  {conMoneda(pago.cantidad, monedaViaje)}
                </span>

                <button
                  className="boton-saldar"
                  onClick={() => (pago.saldado ? onDesaldar(pago) : onSaldar(pago))}
                  title={pago.saldado ? "Marcar como pendiente" : "Marcar como pagado"}
                >
                  {pago.saldado ? "↩︎" : "✓"}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}

export default Resumen;
