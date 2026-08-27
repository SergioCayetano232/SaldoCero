import { useState } from "react";

function Viajeros({ viajeros, onAnadir, onQuitar }) {
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
            <li key={viajero.id}>
              <span>{viajero.nombre}</span>
              <button className="boton-quitar" onClick={() => onQuitar(viajero.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Viajeros;
