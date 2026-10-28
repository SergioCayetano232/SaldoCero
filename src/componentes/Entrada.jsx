import { useEffect, useState } from "react";
import * as datos from "../datos";
import { MONEDAS, monedaConBandera, monedaDeCasa } from "../monedas";
import { haceCuanto } from "../fechas";
import { LARGO_MAXIMO } from "../nombres";
import { codigoDelPortapapeles } from "../codigos";
import { monedaEnLista } from "../pasados";
import { esOrdenador, viajeDeLaTecla } from "../teclado";

// Primera pantalla: o creas un viaje o entras en el de alguien con su código.
function Entrada({ onCrear, onEntrar, cargando, error }) {
  const [nombre, setNombre] = useState("");
  const [moneda, setMoneda] = useState(monedaDeCasa);
  const [deCasa] = useState(monedaDeCasa);
  const [codigo, setCodigo] = useState("");
  // Los viajes por los que ya has pasado, guardados en este navegador.
  const [pasados, setPasados] = useState(() => datos.historial());
  const [nadaCopiado, setNadaCopiado] = useState(false);
  const sePuedePegar = typeof navigator !== "undefined" && Boolean(navigator.clipboard?.readText);

  async function pegar() {
    const pegado = await codigoDelPortapapeles();
    setNadaCopiado(!pegado);
    if (!pegado) return;
    setCodigo(pegado);
    onEntrar(pegado);
  }

  useEffect(() => {
    if (cargando) return;

    function alPulsar(e) {
      const cual = viajeDeLaTecla(e, pasados.length, Boolean(document.querySelector('[aria-modal="true"]')));
      if (cual < 0) return;
      e.preventDefault();
      onEntrar(pasados[cual].codigo);
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [cargando, pasados, onEntrar]);

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
            maxLength={LARGO_MAXIMO}
            autoCapitalize="sentences"
            enterKeyHint="go"
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
                {monedaConBandera(m.codigo)}
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
            // Que el corrector del móvil no convierta el código en una palabra.
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase());
              setNadaCopiado(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && codigo.trim()) onEntrar(codigo);
              if (e.key === "Escape") {
                setCodigo("");
                setNadaCopiado(false);
              }
            }}
            disabled={cargando}
          />
          <button onClick={() => onEntrar(codigo)} disabled={cargando || !codigo.trim()}>
            Entrar
          </button>
        </div>

        <p className="vacio">
          {nadaCopiado ? "No hay ningún código copiado. " : "El que te haya pasado quien creó el viaje. "}
          {sePuedePegar && !codigo && (
            <button className="boton-pegar" onClick={pegar} disabled={cargando}>
              📋 Pegar el que te han mandado
            </button>
          )}
        </p>
      </section>

      {error && <p className="error">{error}</p>}

      {pasados.length > 0 && (
        <section className="tarjeta">
          <h2>
            <span className="icono">🕘</span> Tus viajes
            <span className="titulo-cuantos">{pasados.length}</span>
          </h2>

          <ul className="lista">
            {pasados.map((viaje, i) => (
              <li key={viaje.codigo}>
                <button
                  className="viaje-pasado"
                  onClick={() => onEntrar(viaje.codigo)}
                  disabled={cargando}
                  aria-keyshortcuts={i < 9 ? String(i + 1) : undefined}
                  title={esOrdenador() && i < 9 ? `También con el ${i + 1}` : undefined}
                >
                  <span className="viaje-pasado-nombre">{viaje.nombre}</span>
                  <small className="reparto">
                    {viaje.codigo}
                    {monedaEnLista(viaje.moneda, deCasa) && (
                      <span className="viaje-pasado-cuando">· {monedaEnLista(viaje.moneda, deCasa)}</span>
                    )}
                    {viaje.visto && <span className="viaje-pasado-cuando">· {haceCuanto(viaje.visto)}</span>}
                    {viaje.cerrado && <span className="viaje-pasado-cuando">· 🔒 cerrado</span>}
                  </small>
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
