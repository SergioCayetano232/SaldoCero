import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { esAtajoAyuda, esMac, esOrdenador, listaDeAtajos } from "../teclado";
import { reconocedorDeVoz } from "../dictado";

// El enlace del pie y la ventana con los atajos. Solo en el ordenador: en el
// móvil no hay teclado con el que usarlos.
function Atajos() {
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    function alPulsar(e) {
      if (!esAtajoAyuda(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      setAbierta(true);
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  return (
    <>
      {esOrdenador() && (
        <button className="pie-tema" onClick={() => setAbierta(true)} aria-keyshortcuts="?">
          Atajos de teclado
        </button>
      )}
      {abierta && <VentanaAtajos onCerrar={() => setAbierta(false)} />}
    </>
  );
}

function VentanaAtajos({ onCerrar }) {
  const cerrar = useRef(null);

  useEffect(() => {
    cerrar.current?.focus();

    function alPulsar(e) {
      if (e.key === "Escape") onCerrar();
    }

    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [onCerrar]);

  // Al body, como el QR: así ningún backdrop-filter de por medio la encierra.
  return createPortal(
    <div className="velo" onClick={onCerrar}>
      <div
        className="ventana-qr ventana-atajos"
        role="dialog"
        aria-modal="true"
        aria-label="Atajos de teclado"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="boton-salir ventana-cerrar" onClick={onCerrar} ref={cerrar} title="Cerrar">
          ✕
        </button>

        <h3 className="ventana-titulo">Atajos de teclado</h3>

        <dl className="atajos">
          {listaDeAtajos(esMac(), Boolean(reconocedorDeVoz(window))).map((atajo) => (
            <div className="atajo" key={atajo.que}>
              <dt>
                {atajo.teclas.map((t) => (
                  <kbd key={t}>{t}</kbd>
                ))}
              </dt>
              <dd>{atajo.que}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>,
    document.body
  );
}

export default Atajos;
