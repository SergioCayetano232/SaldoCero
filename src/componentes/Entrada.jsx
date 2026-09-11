import { useState } from "react";
import * as datos from "../datos";
import { MONEDAS } from "../monedas";

// Primera pantalla: o creas un viaje o entras en el de alguien con su código.
function Entrada({ onCrear, onEntrar, cargando, error }) {
  const [nombre, setNombre] = useState("");
  const [moneda, setMoneda] = useState("EUR");
  const [codigo, setCodigo] = useState("");
  // Los viajes por los que ya has pasado, guardados en este navegador.
  const [pasados, setPasados] = useState(() => datos.historial());

  function olvidar(codigoViaje) {
    datos.olvidarDelHistorial(codigoViaje);
    setPasados(datos.historial());
  }

  return (
    <>
      <section className="tarjeta">
        <h2><span className="icono">🗺️</span> Empezar un viaje</h2>

        <div className="fila-formulario">
          <input
            type="text"
            placeholder="Nombre del viaje (Lisboa, Fallas...)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCrear(nombre, moneda);
            }}
            disabled={cargando}
          />
          <select
            className="selector-moneda"
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            disabled={cargando}
            title="Moneda del viaje"
          >
            {MONEDAS.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo}
              </option>
            ))}
          </select>
          <button onClick={() => onCrear(nombre, moneda)} disabled={cargando}>
            Crear
          </button>
        </div>

        <p className="vacio">
          Te daremos un código para pasárselo a los demás. Las cuentas se harán en{" "}
          {moneda}.
        </p>
      </section>

      <section className="tarjeta">
        <h2><span className="icono">🔑</span> Entrar en uno</h2>

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

      {pasados.length > 0 && (
        <section className="tarjeta">
          <h2>
            <span className="icono">🕘</span> Tus viajes
          </h2>

          <ul className="lista">
            {pasados.map((viaje) => (
              <li key={viaje.codigo}>
                <button
                  className="viaje-pasado"
                  onClick={() => onEntrar(viaje.codigo)}
                  disabled={cargando}
                >
                  <span className="viaje-pasado-nombre">{viaje.nombre}</span>
                  <small className="reparto">{viaje.codigo}</small>
                </button>
                <button
                  className="boton-quitar"
                  onClick={() => olvidar(viaje.codigo)}
                  title="Quitar de la lista"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <p className="vacio">
            Solo se guardan en este móvil. Si borras los datos del navegador o
            entras desde otro sitio, vuelves con el código.
          </p>
        </section>
      )}

      <ul className="como-va">
        <li>
          <span className="paso-num">1</span>
          Creas el viaje y les pasas el código
        </li>
        <li>
          <span className="paso-num">2</span>
          Cada uno apunta lo que va pagando
        </li>
        <li>
          <span className="paso-num">3</span>
          Al volver, te decimos quién le debe a quién
        </li>
      </ul>
    </>
  );
}

export default Entrada;
