import { useState } from "react";
import Avatar from "./Avatar";
import NombreEditable from "./NombreEditable";
import { limpiarNombre, LARGO_MAXIMO } from "../nombres";

function Viajeros({ viajeros, colores, recienLlegados, onAnadir, onRenombrar, onQuitar, soy, onSoyYo }) {
  const [nombre, setNombre] = useState("");

  function anadir() {
    const nombreLimpio = limpiarNombre(nombre);
    if (!nombreLimpio) return;

    onAnadir(nombreLimpio);
    setNombre("");
  }

  return (
    <section className="tarjeta">
      <h2><span className="icono">🧳</span> Viajeros</h2>

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

      {viajeros.length === 0 ? (
        <p className="vacio">Aún no hay viajeros. Añade al menos dos para empezar.</p>
      ) : (
        <ul className="lista">
          {viajeros.map((viajero) => (
            <li
              key={viajero.id}
              className={`${viajero.id === soy ? "soy-yo" : ""} ${
                recienLlegados?.has(viajero.id) ? "recien-llegado" : ""
              }`}
            >
              <span className="viajero-quien">
                <Avatar nombre={viajero.nombre} color={colores?.get(viajero.nombre)} />
                <NombreEditable
                  nombre={viajero.nombre}
                  onGuardar={(nuevo) => onRenombrar(viajero.id, nuevo)}
                  titulo={`Cambiar el nombre de ${viajero.nombre}`}
                />
                {viajero.id === soy && <span className="etiqueta-tu">tú</span>}
              </span>

              <button
                className="boton-soy"
                onClick={() => onSoyYo(viajero.id)}
                title={viajero.id === soy ? "Ya no soy yo" : "Este soy yo"}
              >
                {viajero.id === soy ? "✓" : "¿yo?"}
              </button>

              <button
                className="boton-quitar"
                onClick={() => onQuitar(viajero.id, viajero.nombre)}
              >
                ✕
              </button>
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
