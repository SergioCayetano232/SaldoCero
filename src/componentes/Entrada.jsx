import { useState } from "react";

// Primera pantalla: o creas un viaje o entras en el de alguien con su código.
function Entrada({ onCrear, onEntrar, cargando, error }) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");

  return (
    <>
      <section className="tarjeta">
        <h2>🗺️ Empezar un viaje</h2>

        <div className="fila-formulario">
          <input
            type="text"
            placeholder="Nombre del viaje (Lisboa, Fallas...)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCrear(nombre);
            }}
            disabled={cargando}
          />
          <button onClick={() => onCrear(nombre)} disabled={cargando}>
            Crear
          </button>
        </div>

        <p className="vacio">Te daremos un código para pasárselo a los demás.</p>
      </section>

      <section className="tarjeta">
        <h2>🔑 Entrar en uno</h2>

        <div className="fila-formulario">
          <input
            type="text"
            className="campo-codigo"
            placeholder="Código del viaje"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEntrar(codigo);
            }}
            disabled={cargando}
          />
          <button onClick={() => onEntrar(codigo)} disabled={cargando}>
            Entrar
          </button>
        </div>

        <p className="vacio">El que te haya pasado quien creó el viaje.</p>
      </section>

      {error && <p className="error">{error}</p>}
    </>
  );
}

export default Entrada;
