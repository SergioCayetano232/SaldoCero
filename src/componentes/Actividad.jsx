import { useState } from "react";
import { agrupar, frase } from "../actividad";
import { apuntadoHace, haceCuanto } from "../fechas";

const AL_PRINCIPIO = 5;
const COMO_MUCHO = 20;

function cuando(momento) {
  return apuntadoHace(momento) ?? haceCuanto(Date.parse(momento));
}

function Actividad({ actividad = [], viajeros, soy, monedaViaje }) {
  const [todo, setTodo] = useState(false);
  const grupos = agrupar(actividad);
  if (grupos.length === 0) return null;

  const vistos = grupos.slice(0, todo ? COMO_MUCHO : AL_PRINCIPIO);

  return (
    <section className="tarjeta">
      <h2>
        <span className="icono">🕒</span> Lo último
      </h2>

      <ul className="actividad">
        {vistos.map((g) => (
          <li key={g.id} className={`actividad-${g.que}`}>
            <span className="actividad-que">{frase(g, viajeros, soy, monedaViaje)}</span>
            <span className="actividad-cuando">{cuando(g.creadoEn)}</span>
          </li>
        ))}
      </ul>

      {grupos.length > AL_PRINCIPIO && (
        <button className="enlace" onClick={() => setTodo(!todo)}>
          {todo ? "Ver menos" : "Ver más"}
        </button>
      )}
    </section>
  );
}

export default Actividad;
