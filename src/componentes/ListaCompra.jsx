import { useState } from "react";
import { nuevasCompras, ordenarCompras, LARGO_COMPRA } from "../compras";
import { enLista } from "../nombres";
import { t, tn } from "../idioma";

// Lo que falta por comprar. Lo comprado se apunta como gasto de un toque.
function ListaCompra({ compras, cerrado, onApuntar, onMarcar, onQuitar, onGasto }) {
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState("");

  if (cerrado && compras.length === 0) return null;

  const lista = ordenarCompras(compras);
  const faltan = compras.filter((c) => !c.comprado).length;
  const compradas = compras.filter((c) => c.comprado);

  async function apuntar() {
    const { nuevas, repetidas } = nuevasCompras(texto, compras);
    setAviso(
      repetidas.length
        ? tn(repetidas.length, "{cosas} ya estaba en la lista", "{cosas} ya estaban en la lista", { cosas: enLista(repetidas) })
        : ""
    );
    if (nuevas.length === 0) {
      if (repetidas.length) setTexto("");
      return;
    }
    if (await onApuntar(nuevas)) setTexto("");
  }

  return (
    <section className="tarjeta compra">
      <h2>
        <span className="icono">🛒</span> {t("Lista de la compra")}
        {faltan > 0 && <span className="titulo-cuantos">{faltan}</span>}
      </h2>

      {compras.length === 0 && (
        <p className="vacio compra-explica">
          {t("Lo que falta por comprar. Quien lo compre lo marca, y se apunta como gasto de un toque.")}
        </p>
      )}

      {lista.length > 0 && (
        <ul className="compra-lista">
          {lista.map((c) => (
            <li key={c.id} className={c.comprado ? "comprado" : ""}>
              <label>
                <input type="checkbox" checked={c.comprado} disabled={cerrado} onChange={() => onMarcar(c, !c.comprado)} />
                <span className="compra-texto">{c.texto}</span>
              </label>
              {!cerrado && (
                <button
                  className="boton-quitar"
                  onClick={() => onQuitar(c)}
                  title={t("Quitar {cosa} de la lista", { cosa: c.texto })}
                  aria-label={t("Quitar {cosa} de la lista", { cosa: c.texto })}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!cerrado && compradas.length > 0 && (
        <button className="compra-apuntar" onClick={() => onGasto(compradas)}>
          🧾 {tn(compradas.length, "Apuntar el gasto de lo comprado", "Apuntar el gasto de lo comprado ({n})")}
        </button>
      )}

      {!cerrado && (
        <div className="fila-formulario compra-anadir">
          <input
            type="text"
            placeholder={t("Pan, leche y huevos…")}
            value={texto}
            // Con varias cosas de una vez, el tope es para cada una, no para todo.
            maxLength={LARGO_COMPRA * 10}
            enterKeyHint="done"
            onChange={(e) => {
              setTexto(e.target.value);
              setAviso("");
            }}
            onKeyDown={(e) => e.key === "Enter" && apuntar()}
            aria-label={t("Qué hay que comprar")}
          />
          <button onClick={apuntar} disabled={!texto.trim()}>
            {t("Añadir")}
          </button>
        </div>
      )}

      {aviso && (
        <p className="aviso" role="status">
          {aviso}
        </p>
      )}
    </section>
  );
}

export default ListaCompra;
