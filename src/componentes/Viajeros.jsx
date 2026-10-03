import { useState } from "react";
import Avatar from "./Avatar";
import NombreEditable from "./NombreEditable";
import { limpiarNombre, LARGO_MAXIMO } from "../nombres";
import { leerCobro, cobroDe, cobroComoTexto } from "../cobro";

function Viajeros({
  viajeros,
  colores,
  recienLlegados,
  cerrado,
  onAnadir,
  onRenombrar,
  onQuitar,
  onCobro,
  soy,
  onSoyYo,
}) {
  const [nombre, setNombre] = useState("");
  // De quién estás poniendo el Bizum, y lo que llevas escrito.
  const [cobrando, setCobrando] = useState(null);
  const [textoCobro, setTextoCobro] = useState("");
  const [cobroMal, setCobroMal] = useState(false);

  function abrirCobro(viajero) {
    if (cobrando === viajero.id) return setCobrando(null);
    setCobrando(viajero.id);
    setTextoCobro(cobroComoTexto(cobroDe(viajero)));
    setCobroMal(false);
  }

  function guardarCobro() {
    const texto = textoCobro.trim();
    const cobro = leerCobro(texto);
    // Vacío es quitarlo, que también vale.
    if (texto && !cobro) return setCobroMal(true);

    onCobro(cobrando, cobro?.valor ?? "");
    setCobrando(null);
  }

  function anadir() {
    const nombreLimpio = limpiarNombre(nombre);
    if (!nombreLimpio) return;

    onAnadir(nombreLimpio);
    setNombre("");
  }

  return (
    <section className="tarjeta">
      <h2><span className="icono">🧳</span> Viajeros</h2>

      {!cerrado && (
        <div className="fila-formulario">
          <input
            type="text"
            placeholder="Nombre del viajero"
            maxLength={LARGO_MAXIMO}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") anadir();
            }}
          />
          <button onClick={anadir}>Añadir</button>
        </div>
      )}

      {viajeros.length === 0 ? (
        <p className="vacio">Aún no hay viajeros. Añade al menos dos para empezar.</p>
      ) : (
        <ul className="lista">
          {viajeros.map((viajero) => (
            <li
              key={viajero.id}
              className={`${viajero.id === soy ? "soy-yo" : ""} ${
                recienLlegados?.has(viajero.id) ? "recien-llegado" : ""
              } ${cobrando === viajero.id ? "con-cobro" : ""}`}
            >
              <span className="viajero-quien">
                <Avatar nombre={viajero.nombre} color={colores?.get(viajero.nombre)} />
                {cerrado ? (
                  <span className="nombre-fijo">{viajero.nombre}</span>
                ) : (
                  <NombreEditable
                    nombre={viajero.nombre}
                    onGuardar={(nuevo) => onRenombrar(viajero.id, nuevo)}
                    titulo={`Cambiar el nombre de ${viajero.nombre}`}
                  />
                )}
                {viajero.id === soy && <span className="etiqueta-tu">tú</span>}
              </span>

              {/* Con el viaje cerrado también: es cuando más falta hace. */}
              <button
                className={`boton-cobro ${cobroDe(viajero) ? "tiene-cobro" : ""}`}
                onClick={() => abrirCobro(viajero)}
                title={`Bizum o IBAN de ${viajero.nombre}`}
              >
                {cobroDe(viajero)?.tipo === "iban" ? "🏦" : "📲"}
              </button>

              <button
                className="boton-soy"
                onClick={() => onSoyYo(viajero.id)}
                title={viajero.id === soy ? "Ya no soy yo" : "Este soy yo"}
              >
                {viajero.id === soy ? "✓" : "¿yo?"}
              </button>

              {!cerrado && (
                <button
                  className="boton-quitar"
                  onClick={() => onQuitar(viajero.id, viajero.nombre)}
                >
                  ✕
                </button>
              )}

              {cobrando === viajero.id && (
                <div className="editar-cobro">
                  <div className="fila-formulario">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Móvil de Bizum o IBAN"
                      className={cobroMal ? "campo-mal" : ""}
                      value={textoCobro}
                      onChange={(e) => {
                        setTextoCobro(e.target.value);
                        setCobroMal(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") guardarCobro();
                        if (e.key === "Escape") setCobrando(null);
                      }}
                    />
                    <button onClick={guardarCobro}>Guardar</button>
                  </div>
                  <p className={cobroMal ? "cobro-ayuda cobro-mal" : "cobro-ayuda"}>
                    {cobroMal
                      ? "Eso no es un móvil español ni un IBAN válido."
                      : `Para que sepan dónde pagarle a ${viajero.nombre}. Lo ve todo el que tenga el código.`}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {viajeros.length > 0 && !soy && (
        <p className="vacio aviso-quien-soy">
          Marca quién eres tú y te lo resaltamos en las cuentas.
        </p>
      )}
    </section>
  );
}

export default Viajeros;
