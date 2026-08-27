import { calcularLeTocaPagar, calcularPagos, calcularTotal } from "../calculos";
import { conMoneda } from "../monedas";

function Resumen({ balances, gastos, monedaViaje = "EUR" }) {
  const total = calcularTotal(gastos);
  const leTocaPagar = calcularLeTocaPagar(balances);
  const pagos = calcularPagos(balances);

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
        <h3>Cómo saldar cuentas</h3>
        {pagos.length === 0 ? (
          <p className="saldadas">🎉 Cuentas saldadas. Nadie debe nada.</p>
        ) : (
          pagos.map((pago, indice) => (
            <div className="pago" key={indice}>
              <strong>{pago.de}</strong>
              <span className="pago-flecha">→</span>
              <strong>{pago.a}</strong>
              <span className="pago-cantidad">{conMoneda(pago.cantidad, monedaViaje)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Resumen;
