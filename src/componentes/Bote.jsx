import { useState } from "react";
import { conMoneda, leerImporte } from "../monedas";
import { enElBote, hayBote } from "../bote";
import Avatar from "./Avatar";

// Lo que pone cada uno en el bote, y lo que queda dentro.
function Bote({ viajeros, aportaciones, gastos, colores, moneda, cerrado, onPoner, onQuitar }) {
  const [abierto, setAbierto] = useState(false);
  // "todos" mete lo mismo de parte de cada uno, que es como se suele hacer.
  const [quien, setQuien] = useState("todos");
  const [importe, setImporte] = useState("");

  const cantidad = leerImporte(importe);
  const vale = quien && cantidad !== null;
  // Si se ha ido alguien, lo suyo ya no cuenta en las cuentas, así que tampoco aquí.
  const visibles = aportaciones.filter((a) => viajeros.some((v) => v.id === a.viajeroId));
  const queda = enElBote(visibles, gastos);
  const hay = hayBote(visibles, gastos);

  function nombre(id) {
    return viajeros.find((v) => v.id === id)?.nombre ?? "¿?";
  }

  async function poner() {
    if (!vale) return;

    const de = quien === "todos" ? viajeros.map((v) => v.id) : [quien];
    if (await onPoner(de.map((viajeroId) => ({ viajeroId, importe: cantidad })))) {
      setImporte("");
      setAbierto(false);
    }
  }

  if (!hay && cerrado) return null;

  return (
    <section className="tarjeta bote">
      <h2>
        <span className="icono">🫙</span> Bote común
        {hay && (
          <span className={`bote-queda ${queda < -0.005 ? "en-rojo" : ""}`}>
            {queda < -0.005 ? `faltan ${conMoneda(-queda, moneda)}` : `quedan ${conMoneda(queda, moneda)}`}
          </span>
        )}
      </h2>

      {!hay && !abierto && (
        <p className="vacio bote-explica">
          ¿Ponéis dinero entre todos? Apuntad aquí lo que mete cada uno y luego pagad los
          gastos “del bote”.
        </p>
      )}

      {visibles.length > 0 && (
        <ul className="lista-parciales">
          {visibles.map((a) => (
            <li key={a.id} className="parcial">
              <Avatar nombre={nombre(a.viajeroId)} color={colores?.get(nombre(a.viajeroId))} pequeno />
              <span className="parcial-quien">{nombre(a.viajeroId)}</span>
              <span className="parcial-cantidad">{conMoneda(a.importe, moneda)}</span>
              {!cerrado && (
                <button
                  className="boton-quitar"
                  onClick={() => onQuitar(a, nombre(a.viajeroId))}
                  title="Quitarlo del bote"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {queda < -0.005 && (
        <p className="aviso">
          Habéis pagado del bote más de lo que había. Lo que falta sale en las cuentas.
        </p>
      )}

      {!cerrado &&
        (abierto ? (
          <div className="formulario-parcial">
            <div className="fila-formulario">
              <select value={quien} onChange={(e) => setQuien(e.target.value)} aria-label="Quién pone">
                <option value="todos">Cada uno</option>
                {viajeros.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </select>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Cuánto"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && poner()}
                aria-label="Cuánto pone"
                autoFocus
              />
            </div>
            <div className="fila-formulario">
              <button onClick={poner} disabled={!vale}>
                {quien === "todos" && cantidad
                  ? `Poner ${conMoneda(cantidad * viajeros.length, moneda)}`
                  : "Poner"}
              </button>
              <button className="boton-cancelar" onClick={() => setAbierto(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button className="enlace" onClick={() => setAbierto(true)}>
            {hay ? "Poner más en el bote" : "Hacer un bote"}
          </button>
        ))}
    </section>
  );
}

export default Bote;
