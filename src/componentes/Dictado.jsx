import { useEffect, useRef, useState } from "react";
import { reconocedorDeVoz } from "../dictado";
import { esAtajoDictar, esOrdenador } from "../teclado";

// Los fallos del reconocedor, dichos para alguien que no sabe qué es un "not-allowed".
const FALLOS = {
  "not-allowed": "No hay permiso para el micro. Dáselo en los ajustes del navegador.",
  "service-not-allowed": "No hay permiso para el micro. Dáselo en los ajustes del navegador.",
  "no-speech": "No te he oído. Prueba otra vez.",
  "audio-capture": "No encuentro el micro.",
  network: "Para dictar hace falta conexión.",
};

function Dictado({ onDictado }) {
  const [Reconocedor] = useState(() => reconocedorDeVoz(window));
  const [estado, setEstado] = useState("quieto");
  const [oido, setOido] = useState("");
  const [fallo, setFallo] = useState("");
  const reconocedor = useRef(null);
  const boton = useRef(null);

  // Si te vas a otra pantalla escuchando, que no se quede el micro abierto.
  useEffect(() => () => reconocedor.current?.abort(), []);

  const escuchando = estado === "escuchando";

  // Escape lo corta sin rellenar nada, que para eso te has equivocado. Tocar el
  // botón, en cambio, se queda con lo dicho.
  useEffect(() => {
    if (!escuchando) return;

    function alPulsar(e) {
      if (e.key !== "Escape" || document.querySelector('[aria-modal="true"]')) return;
      reconocedor.current?.abort();
      setOido("");
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [escuchando]);

  useEffect(() => {
    if (!Reconocedor) return;

    function alPulsar(e) {
      if (!esAtajoDictar(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      boton.current?.scrollIntoView({ block: "center" });
      boton.current?.click();
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [Reconocedor]);

  if (!Reconocedor) return null;

  function empezar() {
    if (estado === "escuchando") {
      reconocedor.current?.stop();
      return;
    }

    const r = new Reconocedor();
    r.lang = "es-ES";
    r.interimResults = true;
    r.maxAlternatives = 1;
    reconocedor.current = r;
    setOido("");
    setFallo("");
    setEstado("escuchando");

    r.onresult = (e) => {
      const texto = Array.from(e.results, (resultado) => resultado[0].transcript).join(" ");
      setOido(texto);
      if (e.results[e.results.length - 1].isFinal) onDictado(texto);
    };
    r.onerror = (e) => {
      // Al pararlo tú también salta un "aborted": eso no es un fallo.
      if (e.error !== "aborted") setFallo(FALLOS[e.error] ?? "No he podido escucharte.");
    };
    r.onend = () => setEstado("quieto");
    r.start();
  }

  return (
    <div className="dictado">
      <button
        className={`boton-dictar ${escuchando ? "escuchando" : ""}`}
        ref={boton}
        onClick={empezar}
        aria-pressed={escuchando}
        aria-keyshortcuts="d"
        title={esOrdenador() ? "También con la D" : undefined}
      >
        <span className="dictar-icono" aria-hidden="true">
          🎙️
        </span>
        {escuchando ? "Te escucho… (toca para parar)" : "Dictar el gasto"}
      </button>
      {fallo ? (
        <p className="dictado-fallo" role="alert">
          {fallo}
        </p>
      ) : oido ? (
        <p className="dictado-oido" aria-live="polite">
          “{oido}”
        </p>
      ) : (
        !escuchando && <p className="dictado-ayuda">Por ejemplo: “cena de ayer, 45 euros, pagó Ana”</p>
      )}
    </div>
  );
}

export default Dictado;
