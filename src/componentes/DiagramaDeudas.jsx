import { useId } from "react";
import { diagramaDeDeudas, caminoDeFlecha, RADIO } from "../diagrama";
import { inicial } from "../avatares";
import { conMoneda } from "../monedas";

const SIN_COLOR = "var(--tinta-tenue)";

// En el SVG no hay ellipsis: lo cortamos a mano.
const corto = (nombre) => (Array.from(nombre).length > 11 ? `${Array.from(nombre).slice(0, 10).join("")}…` : nombre);

function DiagramaDeudas({ pagos, colores, moneda, soy = null }) {
  const id = useId();
  const d = diagramaDeDeudas(pagos);
  const color = (nombre) => colores?.get(nombre) ?? SIN_COLOR;
  const resumen = d.flechas
    .map((f) => {
      const de = d.deben.find((p) => p.id === f.deId).nombre;
      const a = d.cobran.find((p) => p.id === f.aId).nombre;
      return `${de} le paga ${conMoneda(f.cantidad, moneda)} a ${a}`;
    })
    .join(". ");

  return (
    <figure className="diagrama-deudas">
      <svg viewBox={`0 0 ${d.ancho} ${d.alto}`} role="img" aria-label={resumen}>
        <defs>
          {d.flechas.map((f, i) => (
            <linearGradient
              key={i}
              id={`${id}-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={f.desde.x}
              x2={f.hasta.x}
              y1="0"
              y2="0"
            >
              <stop offset="0" style={{ stopColor: color(d.deben.find((p) => p.id === f.deId).nombre) }} />
              <stop offset="1" style={{ stopColor: color(d.cobran.find((p) => p.id === f.aId).nombre) }} />
            </linearGradient>
          ))}
        </defs>

        {d.flechas.map((f, i) => {
          const punta = color(d.cobran.find((p) => p.id === f.aId).nombre);
          const ancho = f.grosor / 2 + 4;

          return (
            <g key={`${f.deId}-${f.aId}`} className="diagrama-flecha" style={{ "--retraso": `${i * 0.12}s` }}>
              <path
                d={caminoDeFlecha(f)}
                pathLength="1"
                stroke={`url(#${id}-${i})`}
                strokeWidth={f.grosor}
                strokeLinecap="round"
                fill="none"
              />
              <polygon
                className="diagrama-punta"
                points={`${f.hasta.x + 7},${f.hasta.y} ${f.hasta.x - 3},${f.hasta.y - ancho} ${f.hasta.x - 3},${f.hasta.y + ancho}`}
                style={{ fill: punta }}
              />
            </g>
          );
        })}

        {d.flechas.map((f) => {
          const texto = conMoneda(f.cantidad, moneda);
          const ancho = Math.max(44, texto.length * 6.6 + 14);

          return (
            <g
              key={`cifra-${f.deId}-${f.aId}`}
              className="diagrama-cifra"
              transform={`translate(${f.etiqueta.x} ${f.etiqueta.y})`}
            >
              <rect x={-ancho / 2} y="-11" width={ancho} height="22" rx="11" />
              <text y="4" textAnchor="middle">
                {texto}
              </text>
            </g>
          );
        })}

        {[...d.deben, ...d.cobran].map((p) => (
          <g key={`${p.x}-${p.id}`} className="diagrama-persona" transform={`translate(${p.x} ${p.y})`}>
            {p.id === soy && <circle className="diagrama-yo" r={RADIO + 4} />}
            <circle r={RADIO} style={{ fill: color(p.nombre) }} />
            <text className="diagrama-inicial" y="5" textAnchor="middle">
              {inicial(p.nombre)}
            </text>
            <text className="diagrama-nombre" y={RADIO + 15} textAnchor="middle">
              {corto(p.nombre)}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

export default DiagramaDeudas;
