import { calcularLeTocaPagar, calcularPagos, calcularTotal } from "../calculos";

function Resumen({ balances, gastos }) {
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
        <div className="total-cifra">{total.toFixed(2)} €</div>
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
                puso {viajero.puesto.toFixed(2)} € · le tocan {viajero.tocaPagar.toFixed(2)} €
              </small>
            </div>

            <div className="balance-cifra">
              <div className="balance-importe">
                {viajero.balance >= 0 ? "+" : "−"}
                {Math.abs(viajero.balance).toFixed(2)} €
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
              <span className="pago-cantidad">{pago.cantidad.toFixed(2)} €</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Resumen;
