import { useState } from "react";
import { gastoPorDia, topeRedondo, diasConEtiqueta } from "../barras";
import { ritmoDeGasto } from "../presupuesto";
import { conMoneda } from "../monedas";
import { enCorto } from "../fechas";

// Lo que se gastó cada día, en barras, con la media del viaje de referencia.
function PorDias({ gastos, moneda }) {
  // El día que estás mirando, con el dedo o el ratón.
  const [elegido, setElegido] = useState(null);

  const dias = gastoPorDia(gastos);
  // Con un día solo no hay nada que comparar.
  if (dias.length < 2) return null;

  const ritmo = ritmoDeGasto(gastos);
  const mayor = Math.max(...dias.map((d) => d.total));
  const tope = topeRedondo(mayor);
  const conEtiqueta = new Set(diasConEtiqueta(dias.length));
  const iMayor = dias.findIndex((d) => d.total === mayor);
  const alto = (cantidad) => `${(cantidad / tope) * 100}%`;
  // Las cifras del eje sin decimales, que ahí sobran.
  const corta = (cantidad) => conMoneda(cantidad, moneda).replace(/[.,]00(?=\D|$)/, "");

  // Igual que en el donut: con ratón basta pasar por encima, con el dedo se toca.
  function mirar(i) {
    return {
      onPointerEnter: (e) => e.pointerType === "mouse" && setElegido(i),
      onPointerLeave: (e) => e.pointerType === "mouse" && setElegido(null),
      onPointerUp: (e) => e.pointerType !== "mouse" && setElegido(elegido === i ? null : i),
      onFocus: () => setElegido(i),
      onBlur: () => setElegido(null),
    };
  }

  const visto = elegido !== null ? dias[elegido] : null;

  return (
    <div className={`por-dias ${visto ? "con-elegido" : ""}`}>
      <div className="por-dias-cabecera">
        <span className="por-dias-titulo">Día a día</span>
        {ritmo && (
          <span className="por-dias-media">
            <span className="por-dias-clave" aria-hidden="true" />
            media {conMoneda(ritmo.porDia, moneda)}
          </span>
        )}
      </div>

      <div className="por-dias-grafica">
        <div className="por-dias-eje" aria-hidden="true">
          <span>{corta(tope)}</span>
          <span>{corta(tope / 2)}</span>
          <span>{corta(0)}</span>
        </div>

        <div
          className="por-dias-zona"
          role="img"
          aria-label={dias.map((d) => `${enCorto(d.fecha)}: ${conMoneda(d.total, moneda)}`).join(", ")}
        >
          <div className="por-dias-rejilla" style={{ bottom: "50%" }} />
          <div className="por-dias-rejilla" style={{ bottom: "100%" }} />

          {ritmo && <div className="por-dias-linea-media" style={{ bottom: alto(ritmo.porDia) }} />}

          <div className="por-dias-columnas">
            {dias.map((d, i) => (
              <div
                key={d.fecha}
                className={`por-dias-columna ${i === elegido ? "elegida" : ""}`}
                tabIndex={0}
                aria-label={`${enCorto(d.fecha)}: ${conMoneda(d.total, moneda)}`}
                style={{ "--orden": i }}
                {...mirar(i)}
              >
                {/* Solo el día más caro lleva su cifra, que el resto ya está en el eje. */}
                {i === iMayor && elegido === null && (
                  <span className="por-dias-cifra" style={{ bottom: alto(d.total) }}>
                    {corta(d.total)}
                  </span>
                )}
                <div
                  className={`por-dias-barra ${d.total === 0 ? "vacia" : ""}`}
                  style={{ height: d.total === 0 ? undefined : alto(d.total) }}
                />
              </div>
            ))}
          </div>

          {visto && (
            <div
              className="por-dias-globo"
              // Sin salirse de la gráfica: ni por arriba con el día más caro,
              // ni por los lados con el primero y el último.
              style={{
                left: `clamp(48px, ${((elegido + 0.5) / dias.length) * 100}%, calc(100% - 48px))`,
                bottom: `min(${alto(visto.total)}, calc(100% - 66px))`,
              }}
            >
              <span>{enCorto(visto.fecha)}</span>
              <strong>{conMoneda(visto.total, moneda)}</strong>
              <small>
                {visto.gastos === 0
                  ? "sin gastos"
                  : `${visto.gastos} ${visto.gastos === 1 ? "gasto" : "gastos"}`}
              </small>
            </div>
          )}
        </div>
      </div>

      <div className="por-dias-fechas" aria-hidden="true">
        {dias.map((d, i) => (
          <span key={d.fecha}>{conEtiqueta.has(i) ? enCorto(d.fecha).replace(/^\S+ /, "") : ""}</span>
        ))}
      </div>
    </div>
  );
}

export default PorDias;
