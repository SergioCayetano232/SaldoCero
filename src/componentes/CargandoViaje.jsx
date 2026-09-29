// Lo que se ve mientras llega el viaje: la forma de las tarjetas, sin los datos.

function Caja({ ancho, alto = 12, redonda = false }) {
  return (
    <span
      className={`esqueleto ${redonda ? "esqueleto-redondo" : ""}`}
      style={{ width: ancho, height: alto }}
    />
  );
}

// Anchos distintos a propósito: si todas las filas miden igual, parece un código de barras.
const VIAJEROS = ["38%", "52%", "30%"];
const GASTOS = [
  ["46%", "62%"],
  ["34%", "50%"],
  ["55%", "40%"],
];

function CargandoViaje() {
  return (
    <>
      <section className="tarjeta" role="status" aria-label="Cargando el viaje">
        <div className="esqueleto-fila">
          <Caja ancho={26} alto={26} redonda />
          <Caja ancho="45%" alto={20} />
        </div>
        <div className="esqueleto-fila">
          <Caja ancho={130} alto={40} />
          <Caja ancho={120} alto={40} />
        </div>
      </section>

      <section className="tarjeta" aria-hidden="true">
        <Caja ancho={90} alto={14} />
        {VIAJEROS.map((ancho) => (
          <div className="esqueleto-fila" key={ancho}>
            <Caja ancho={34} alto={34} redonda />
            <Caja ancho={ancho} />
          </div>
        ))}
      </section>

      <section className="tarjeta" aria-hidden="true">
        <Caja ancho={80} alto={14} />
        {GASTOS.map(([concepto, reparto]) => (
          <div className="esqueleto-fila" key={concepto}>
            <Caja ancho={22} alto={22} redonda />
            <div className="esqueleto-lineas">
              <Caja ancho={concepto} />
              <Caja ancho={reparto} alto={9} />
            </div>
            <Caja ancho={56} alto={14} />
          </div>
        ))}
      </section>
    </>
  );
}

export default CargandoViaje;
