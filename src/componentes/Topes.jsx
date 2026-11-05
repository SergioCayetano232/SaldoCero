import { useState } from "react";
import { conMoneda, leerImporte, simboloDe } from "../monedas";
import { textoPresupuesto } from "../presupuesto";
import { estadoDeTopes, sinTope, conTope } from "../topes";

// Un tope por categoría, debajo de en qué se va el dinero. Fijo, con el viaje
// cerrado: se ven pero ya no se tocan.
function Topes({ gastos, topes, moneda, fijo = false, onGuardar }) {
  // La categoría que estás poniendo o cambiando, y lo escrito.
  const [editando, setEditando] = useState(null);
  const [texto, setTexto] = useState("");

  const estados = estadoDeTopes(gastos, topes);
  const libres = sinTope(topes);
  const cantidad = leerImporte(texto);

  if (fijo && estados.length === 0) return null;

  function abrir(categoria) {
    setEditando(categoria);
    setTexto(topes[categoria] ? String(topes[categoria]).replace(".", ",") : "");
  }

  async function guardar(valor) {
    if (await onGuardar(conTope(topes, editando, valor))) setEditando(null);
  }

  const formulario = (
    <div className="tope-editando">
      {/* Al cambiar uno ya sabes cuál es; al poner uno nuevo, se elige. */}
      {topes[editando] ? (
        <span className="tope-nombre">{estados.find((e) => e.id === editando)?.nombre}</span>
      ) : (
        <select value={editando} onChange={(e) => setEditando(e.target.value)} aria-label="Categoría">
          {libres.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.nombre}
            </option>
          ))}
        </select>
      )}
      <label className="presupuesto-campo">
        <span>Como mucho</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="300"
          enterKeyHint="done"
          value={texto}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && cantidad) guardar(cantidad);
            if (e.key === "Escape") setEditando(null);
          }}
          autoFocus
        />
        <span>{simboloDe(moneda)}</span>
      </label>
      <div className="tope-botones">
        <button onClick={() => guardar(cantidad)} disabled={!cantidad}>
          Guardar
        </button>
        {topes[editando] && (
          <button className="enlace" onClick={() => guardar(null)}>
            Quitar
          </button>
        )}
        <button className="enlace" onClick={() => setEditando(null)}>
          Cancelar
        </button>
      </div>
    </div>
  );

  return (
    <div className="topes">
      {estados.length > 0 && <h3>Topes por categoría</h3>}

      <ul className="topes-lista">
        {estados.map((t) =>
          editando === t.id ? (
            <li key={t.id}>{formulario}</li>
          ) : (
            <li key={t.id} className={`tope ${t.estado.nivel}`} style={{ "--color-categoria": t.color }}>
              <div className="tope-cabeza">
                <span className="tope-nombre">
                  {t.emoji} {t.nombre}
                </span>
                <span className="tope-cifras">
                  {conMoneda(t.gastado, moneda)} <small>de {conMoneda(t.tope, moneda)}</small>
                </span>
                {!fijo && (
                  <button
                    className="presupuesto-cambiar tope-cambiar"
                    onClick={() => abrir(t.id)}
                    title={`Cambiar el tope de ${t.nombre}`}
                  >
                    ✎
                  </button>
                )}
              </div>
              <div
                className="tope-barra"
                role="progressbar"
                aria-valuenow={t.estado.porcentaje}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Tope de ${t.nombre}`}
              >
                <div className="tope-relleno" style={{ width: `${t.estado.relleno * 100}%` }} />
              </div>
              <small className="tope-texto">{textoPresupuesto(t.estado, t.tope, moneda)}</small>
            </li>
          )
        )}
        {editando && !topes[editando] && <li>{formulario}</li>}
      </ul>

      {!fijo && !editando && libres.length > 0 && (
        <button className="enlace" onClick={() => abrir(libres[0].id)}>
          + Ponerle un tope a una categoría
        </button>
      )}
    </div>
  );
}

export default Topes;
