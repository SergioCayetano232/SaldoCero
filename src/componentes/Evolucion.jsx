import { useId, useState } from "react";
import { evolucionDeSaldos, conSigno, diaEn } from "../evolucion";
import { conMoneda } from "../monedas";
import { enCorto } from "../fechas";
import Avatar from "./Avatar";

// Medidas del dibujo de cada fila. Se estira a lo ancho, el trazo no.
const ANCHO = 200;
const ALTO = 44;
const MEDIO = ALTO / 2;

// Una fila por persona y todas con la misma escala: así se compara de un vistazo
// quién adelantó más, sin tener que distinguir ocho colores en una sola gráfica.
function Evolucion({ viajeros, gastos, aportaciones, colores, moneda, soy }) {
  const id = useId();
  const [dia, setDia] = useState(null);
  const [tabla, setTabla] = useState(false);

  const e = evolucionDeSaldos(viajeros, gastos, aportaciones);
  if (!e) return null;

  const n = e.dias.length;
  const x = (i) => (i / (n - 1)) * ANCHO;
  const y = (saldo) => MEDIO - (saldo / e.tope) * (MEDIO - 3);
  const dinero = (s) => conSigno(s, (v) => conMoneda(v, moneda));
  const visto = dia ?? n - 1;

  function mirar(evento) {
    const { left, width } = evento.currentTarget.getBoundingClientRect();
    setDia(diaEn((evento.clientX - left) / width, n));
  }

  return (
    <div className="evolucion">
      <div className="evolucion-cabecera">
        <span className="evolucion-titulo">Cómo han ido las cuentas</span>
        <span className="evolucion-dia" aria-live="polite">
          {dia === null ? "al final" : enCorto(e.dias[dia])}
        </span>
      </div>
      <p className="evolucion-ayuda">
        <span className="evolucion-clave le-deben" aria-hidden="true" /> le deben
        <span className="evolucion-clave debe" aria-hidden="true" /> debe
      </p>

      <ul className="evolucion-filas">
        {e.series.map((s) => {
          const linea = s.saldos.map((v, i) => `${i ? "L" : "M"} ${x(i)} ${y(v)}`).join(" ");
          const area = `${linea} L ${ANCHO} ${MEDIO} L 0 ${MEDIO} Z`;
          const ahora = s.saldos[visto];

          return (
            <li
              key={s.id}
              className={`evolucion-fila ${s.id === soy ? "es-mio" : ""}`}
              aria-label={`${s.nombre}: el primer día ${dinero(s.saldos[0])}, al final ${dinero(s.saldos[n - 1])}`}
            >
              <span className="evolucion-quien">
                <Avatar nombre={s.nombre} color={colores?.get(s.nombre)} pequeno />
                <span className="evolucion-nombre">{s.nombre}</span>
              </span>

              <svg
                className="evolucion-linea"
                viewBox={`0 0 ${ANCHO} ${ALTO}`}
                preserveAspectRatio="none"
                aria-hidden="true"
                onPointerMove={mirar}
                onPointerDown={mirar}
                onPointerLeave={(ev) => ev.pointerType === "mouse" && setDia(null)}
              >
                <clipPath id={`${id}-${s.id}-arriba`}>
                  <rect x="0" y="0" width={ANCHO} height={MEDIO} />
                </clipPath>
                <clipPath id={`${id}-${s.id}-abajo`}>
                  <rect x="0" y={MEDIO} width={ANCHO} height={MEDIO} />
                </clipPath>

                <line className="evolucion-cero" x1="0" x2={ANCHO} y1={MEDIO} y2={MEDIO} />

                <g clipPath={`url(#${id}-${s.id}-arriba)`} className="le-deben">
                  <path className="evolucion-area" d={area} />
                  <path className="evolucion-trazo" d={linea} />
                </g>
                <g clipPath={`url(#${id}-${s.id}-abajo)`} className="debe">
                  <path className="evolucion-area" d={area} />
                  <path className="evolucion-trazo" d={linea} />
                </g>

                {dia !== null && <line className="evolucion-cruz" x1={x(dia)} x2={x(dia)} y1="0" y2={ALTO} />}
              </svg>

              <span className={`evolucion-cifra ${ahora > 0.005 ? "le-deben" : ahora < -0.005 ? "debe" : ""}`}>
                {dinero(ahora)}
              </span>
            </li>
          );
        })}
      </ul>

      <button className="enlace evolucion-ver-tabla" onClick={() => setTabla(!tabla)} aria-expanded={tabla}>
        {tabla ? "Ocultar los números" : "Ver los números"}
      </button>

      {tabla && (
        <div className="evolucion-tabla">
          <table>
            <thead>
              <tr>
                <th scope="col">Día</th>
                {e.series.map((s) => (
                  <th key={s.id} scope="col">
                    {s.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {e.dias.map((fecha, i) => (
                <tr key={fecha}>
                  <th scope="row">{enCorto(fecha)}</th>
                  {e.series.map((s) => (
                    <td key={s.id}>{dinero(s.saldos[i])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Evolucion;
