import { useState } from "react";

function Viajeros({ viajeros, onAnadir, onQuitar, soy, onSoyYo }) {
  const [nombre, setNombre] = useState("");

  function anadir() {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio === "") return;

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
            <li key={viajero.id} className={viajero.id === soy ? "soy-yo" : ""}>
              <span>
                {viajero.nombre}
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
