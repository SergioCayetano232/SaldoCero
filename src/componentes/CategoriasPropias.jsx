import { useState } from "react";
import { MAXIMO_PROPIAS, nuevaCategoria, sePuedeQuitar, sinCategoria } from "../categorias";
import { t } from "../idioma";

// El "+ Otra" de las categorías y lo que se abre debajo para crearla.
function CategoriasPropias({ propias, gastos, onGuardar, onCreada, onQuitada }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [emoji, setEmoji] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cerrar() {
    setAbierto(false);
    setNombre("");
    setEmoji("");
    setError("");
  }

  async function crear() {
    const { lista, error } = nuevaCategoria(propias, nombre, emoji);
    if (error) return setError(error);

    setGuardando(true);
    const bien = await onGuardar(lista);
    setGuardando(false);
    if (!bien) return;

    onCreada(lista.at(-1).id);
    cerrar();
  }

  async function quitar(id) {
    if (await onGuardar(sinCategoria(propias, id))) onQuitada(id);
  }

  function teclas(e) {
    if (e.key === "Enter") crear();
    if (e.key === "Escape") {
      // Que no cierre también el formulario del gasto.
      e.stopPropagation();
      cerrar();
    }
  }

  const caben = propias.length < MAXIMO_PROPIAS;

  return (
    <>
      {!abierto && (
        <button className="pastilla-categoria pastilla-nueva" onClick={() => setAbierto(true)}>
          ＋ {t("Otra")}
        </button>
      )}

      {abierto && (
        <div className="categoria-nueva">
          {caben ? (
            <div className="fila-formulario">
              <input
                type="text"
                className="campo-emoji"
                placeholder="🏷️"
                aria-label={t("Emoji")}
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                onKeyDown={teclas}
              />
              <input
                type="text"
                autoFocus
                maxLength={16}
                autoComplete="off"
                autoCapitalize="sentences"
                placeholder={t("Nombre (Super, Peajes...)")}
                className={error ? "campo-mal" : ""}
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setError("");
                }}
                onKeyDown={teclas}
              />
              <button onClick={crear} disabled={guardando || !nombre.trim()}>
                {t("Crear")}
              </button>
            </div>
          ) : (
            <p className="cobro-ayuda">{t("Ya tenéis {n} propias, quitad alguna antes.", { n: MAXIMO_PROPIAS })}</p>
          )}

          {error && <p className="cobro-ayuda cobro-mal">{error}</p>}

          {propias.length > 0 && (
            <div className="propias">
              {propias.map((c) =>
                sePuedeQuitar(c.id, gastos) ? (
                  <button
                    key={c.id}
                    className="pastilla-categoria quitar-propia"
                    style={{ "--color-categoria": c.color }}
                    onClick={() => quitar(c.id)}
                    title={t("Quitar {nombre}", { nombre: c.nombre })}
                  >
                    {c.emoji} {c.nombre} <span aria-hidden="true">×</span>
                  </button>
                ) : (
                  <span key={c.id} className="pastilla-categoria con-gastos" title={t("Tiene gastos: pásalos a otra antes de quitarla")}>
                    {c.emoji} {c.nombre}
                  </span>
                )
              )}
            </div>
          )}

          <button className="enlace" onClick={cerrar}>
            {t("Listo")}
          </button>
        </div>
      )}
    </>
  );
}

export default CategoriasPropias;
