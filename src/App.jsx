import { useState } from "react";
import "./App.css";

function App() {
  // "viajeros" es la lista de personas. Empieza vacía.
  // "setViajeros" es la función para cambiarla.
  const [viajeros, setViajeros] = useState([]);

  // Guarda lo que se escribe en el campo de texto.
  const [nombre, setNombre] = useState("");

  // Añade un viajero nuevo a la lista.
  function anadirViajero() {
    const nombreLimpio = nombre.trim(); // quita espacios sobrantes
    if (nombreLimpio === "") return; // si está vacío, no hace nada

    const nuevoViajero = {
      id: Date.now(), // un identificador único basado en la hora actual
      nombre: nombreLimpio,
    };

    setViajeros([...viajeros, nuevoViajero]); // añade el nuevo al final
    setNombre(""); // vacía el campo de texto
  }

  // Quita un viajero según su id.
  function quitarViajero(id) {
    setViajeros(viajeros.filter((viajero) => viajero.id !== id));
  }

  return (
    <div className="app">
      <h1>SaldoCero</h1>
      <p>Repartimos los gastos del viaje entre todos.</p>

      <section className="tarjeta">
        <h2>Viajeros</h2>

        <div className="fila-formulario">
          <input
            type="text"
            placeholder="Nombre del viajero"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") anadirViajero();
            }}
          />
          <button onClick={anadirViajero}>Añadir</button>
        </div>

        {viajeros.length === 0 ? (
          <p className="vacio">
            Aún no hay viajeros. Añade al menos dos para empezar.
          </p>
        ) : (
          <ul className="lista">
            {viajeros.map((viajero) => (
              <li key={viajero.id}>
                <span>{viajero.nombre}</span>
                <button
                  className="boton-quitar"
                  onClick={() => quitarViajero(viajero.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;