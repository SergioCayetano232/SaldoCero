import { calcularLeTocaPagar, calcularPagos, calcularTotal } from "../calculos";

function Resumen({ balances, gastos }) {
  const total = calcularTotal(gastos);
  const leTocaPagar = calcularLeTocaPagar(balances);
  const pagos = calcularPagos(balances);

  return (
    <section className="tarjeta">
      <h2>📊 Resumen</h2>

      <p className="resumen-totales">
        Total gastado: <strong>{total.toFixed(2)} €</strong>
      </p>

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
          <li key={viajero.id} className="fila-balance">
            <span>
              <strong>{viajero.nombre}</strong> ha puesto {viajero.puesto.toFixed(2)} €
              <br />
              <small className="reparto">le tocan {viajero.tocaPagar.toFixed(2)} €</small>
            </span>
            <span className={viajero.balance >= 0 ? "positivo" : "negativo"}>
              {viajero.balance >= 0 ? "le deben " : "debe "}
              {Math.abs(viajero.balance).toFixed(2)} €
            </span>
          </li>
        ))}
      </ul>

      <div className="saldar">
        <h3>Cómo saldar cuentas</h3>
        {pagos.length === 0 ? (
          <p className="vacio">Cuentas saldadas. Nadie debe nada. 🎉</p>
        ) : (
          <ul className="lista">
            {pagos.map((pago, indice) => (
              <li key={indice}>
                <span>
                  <strong>{pago.de}</strong> paga {pago.cantidad.toFixed(2)} € a{" "}
                  <strong>{pago.a}</strong>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Resumen;
