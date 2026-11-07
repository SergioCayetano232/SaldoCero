import { useState } from "react";
import { conMoneda, leerImporte, simboloDe } from "../monedas";
import { textoPresupuesto } from "../presupuesto";
import { estadoDeTopes, sinTope, conTope } from "../topes";
import { t } from "../idioma";

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
        <span className="tope-nombre">{t(estados.find((e) => e.id === editando)?.nombre ?? "")}</span>
      ) : (
        <select value={editando} onChange={(e) => setEditando(e.target.value)} aria-label={t("Categoría")}>
          {libres.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {t(c.nombre)}
            </option>
          ))}
        </select>
      )}
      <label className="presupuesto-campo">
        <span>{t("Como mucho")}</span>
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
          {t("Guardar")}
        </button>
        {topes[editando] && (
          <button className="enlace" onClick={() => guardar(null)}>
            {t("Quitar")}
          </button>
        )}
        <button className="enlace" onClick={() => setEditando(null)}>
          {t("Cancelar")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="topes">
      {estados.length > 0 && <h3>{t("Topes por categoría")}</h3>}

      <ul className="topes-lista">
        {estados.map((tope) =>
          editando === tope.id ? (
            <li key={tope.id}>{formulario}</li>
          ) : (
            <li key={tope.id} className={`tope ${tope.estado.nivel}`} style={{ "--color-categoria": tope.color }}>
              <div className="tope-cabeza">
                <span className="tope-nombre">
                  {tope.emoji} {t(tope.nombre)}
                </span>
                <span className="tope-cifras">
                  {conMoneda(tope.gastado, moneda)} <small>{t("de {cifra}", { cifra: conMoneda(tope.tope, moneda) })}</small>
                </span>
                {!fijo && (
                  <button
                    className="presupuesto-cambiar tope-cambiar"
                    onClick={() => abrir(tope.id)}
                    title={t("Cambiar el tope de {categoria}", { categoria: t(tope.nombre) })}
                  >
                    ✎
                  </button>
                )}
              </div>
              <div
                className="tope-barra"
                role="progressbar"
                aria-valuenow={tope.estado.porcentaje}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t("Tope de {categoria}", { categoria: t(tope.nombre) })}
              >
                <div className="tope-relleno" style={{ width: `${tope.estado.relleno * 100}%` }} />
              </div>
              <small className="tope-texto">{textoPresupuesto(tope.estado, tope.tope, moneda)}</small>
            </li>
          )
        )}
        {editando && !topes[editando] && <li>{formulario}</li>}
      </ul>

      {!fijo && !editando && libres.length > 0 && (
        <button className="enlace" onClick={() => abrir(libres[0].id)}>
          {t("+ Ponerle un tope a una categoría")}
        </button>
      )}
    </div>
  );
}

export default Topes;
