import { useState } from "react";
import { porcentajes, trozosDelDonut, puntoMedio } from "../donut";
import { conMoneda } from "../monedas";

const TAMANO = 140;
const CENTRO = TAMANO / 2;
const RADIO = 52;
const GROSOR = 18;
const VUELTA = 2 * Math.PI * RADIO;
// Unos 2px de separación a este radio.
const HUECO = 2.5;
// Por debajo de esto el emoji no cabe en el trozo, y ya está en la lista.
const MINIMO_PARA_EMOJI = 30;

// En qué se ha ido el dinero: un donut y, al lado, la lista con las cifras.
function Desglose({ porCategoria, moneda }) {
  // La que estás mirando, con el dedo o el ratón. Si no, la que más pesa.
  const [elegida, setElegida] = useState(null);

  const cantidades = porCategoria.map((c) => c.total);
  const trozos = trozosDelDonut(cantidades, HUECO);
  const tantos = porcentajes(cantidades);

  const iElegida = porCategoria.findIndex((c) => c.id === elegida);
  const enMedio = iElegida >= 0 ? iElegida : 0;
  const destacada = porCategoria[enMedio];

  function tocar(id) {
    setElegida(elegida === id ? null : id);
  }

  // Con ratón basta con pasar por encima. Con el dedo no hay "encima": tocar
  // elige y volver a tocar suelta. Si se mezclan, el toque elige y suelta a la vez.
  function mirar(id) {
    return {
      onPointerEnter: (e) => e.pointerType === "mouse" && setElegida(id),
      onPointerLeave: (e) => e.pointerType === "mouse" && setElegida(null),
      onPointerUp: (e) => e.pointerType !== "mouse" && tocar(id),
    };
  }

  return (
    <div className={`desglose ${elegida ? "con-elegida" : ""}`}>
      <div className="donut">
        <svg
          viewBox={`0 0 ${TAMANO} ${TAMANO}`}
          role="img"
          aria-label={porCategoria
            .map((c, i) => `${c.nombre} ${tantos[i]}%`)
            .join(", ")}
        >
          <circle className="donut-pista" cx={CENTRO} cy={CENTRO} r={RADIO} strokeWidth={GROSOR} />

          {porCategoria.map((c, i) => (
            <circle
              key={c.id}
              className={`donut-trozo ${c.id === elegida ? "elegido" : ""}`}
              cx={CENTRO}
              cy={CENTRO}
              r={RADIO}
              strokeWidth={GROSOR}
              stroke={c.color}
              style={{
                "--largo": `${(trozos[i].angulo / 360) * VUELTA}px`,
                "--vuelta": `${VUELTA}px`,
                "--orden": i,
                // SVG empieza a las tres; nosotros, arriba.
                transform: `rotate(${trozos[i].inicio - 90}deg)`,
              }}
              {...mirar(c.id)}
            />
          ))}

          {porCategoria.map((c, i) => {
            if (trozos[i].angulo < MINIMO_PARA_EMOJI) return null;
            const p = puntoMedio(trozos[i], CENTRO, RADIO);

            return (
              <text
                key={c.id}
                className="donut-emoji"
                x={p.x}
                y={p.y}
                style={{ "--orden": i }}
              >
                {c.emoji}
              </text>
            );
          })}
        </svg>

        {/* Va encima del SVG y no dentro: en HTML el texto se maqueta mejor. */}
        <div className="donut-centro" key={destacada.id}>
          <span className="donut-porcentaje">{tantos[enMedio]}%</span>
          <span className="donut-nombre">{destacada.nombre}</span>
        </div>
      </div>

      <ul className="desglose-lista">
        {porCategoria.map((c, i) => (
          <li
            key={c.id}
            className={c.id === elegida ? "elegida" : ""}
            tabIndex={0}
            {...mirar(c.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                tocar(c.id);
              }
            }}
          >
            <span className="desglose-punto" style={{ backgroundColor: c.color }} />
            <span className="desglose-nombre">
              {c.emoji} {c.nombre}
            </span>
            <strong>{conMoneda(c.total, moneda)}</strong>
            <small className="desglose-tanto">{tantos[i]}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Desglose;
