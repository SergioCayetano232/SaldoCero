import { useEffect, useRef, useState } from "react";
import { totalDelTicket, totalComoTexto } from "../leerTicket";
import { leerFoto } from "../ocr";
import { conMoneda } from "../monedas";

// El botón de leer el total de la foto, y lo que va saliendo. No guarda nada:
// pone el importe en su campo y tú lo miras antes de apuntarlo.
function LeerTotal({ foto, moneda, onTotal }) {
  const [estado, setEstado] = useState("quieto");
  const [avance, setAvance] = useState(0);
  const [leido, setLeido] = useState(null);
  // Si quitas la foto a medio leer, lo que llegue luego ya no vale.
  const sigue = useRef(true);

  useEffect(() => {
    sigue.current = true;
    return () => {
      sigue.current = false;
    };
  }, []);

  async function leer() {
    setEstado("leyendo");
    setAvance(0);
    try {
      const texto = await leerFoto(foto, (p) => sigue.current && setAvance(p));
      if (!sigue.current) return;

      const total = totalDelTicket(texto);
      setLeido(total);
      setEstado(total === null ? "nada" : "leido");
      if (total !== null) onTotal(totalComoTexto(total));
    } catch (fallo) {
      console.error("No hemos podido leer el ticket.", fallo);
      if (sigue.current) setEstado("fallo");
    }
  }

  if (estado === "leyendo") {
    return (
      <div className="leer-total leyendo" role="status">
        <span>🔍 Leyendo el ticket… {Math.round(avance * 100)} %</span>
        <span className="leer-total-barra" aria-hidden="true">
          <span style={{ transform: `scaleX(${avance})` }} />
        </span>
      </div>
    );
  }

  return (
    <div className="leer-total">
      <button className="boton-foto" onClick={leer}>
        🔍 {estado === "quieto" ? "Leer el total" : "Leer otra vez"}
      </button>
      {estado === "leido" && (
        <span className="leer-total-bien" role="status">
          ✓ {conMoneda(leido, moneda)}. Revísalo antes de apuntarlo.
        </span>
      )}
      {estado === "nada" && (
        <span className="leer-total-mal" role="status">
          No encuentro el total. Escríbelo tú.
        </span>
      )}
      {estado === "fallo" && (
        <span className="leer-total-mal" role="alert">
          No he podido leerlo. La primera vez hace falta conexión.
        </span>
      )}
    </div>
  );
}

export default LeerTotal;
