import { useEffect, useRef, useState } from "react";
import { totalDelTicket, totalComoTexto, fechaDelTicket } from "../leerTicket";
import { hoy, enCorto } from "../fechas";
import { leerFoto } from "../ocr";
import { conMoneda } from "../monedas";
import { esAtajoLeer } from "../teclado";
import { t } from "../idioma";

// El botón de leer el total de la foto, y lo que va saliendo. No guarda nada:
// pone el importe en su campo, y el día si lo ve, y tú lo miras antes de apuntarlo.
function LeerTotal({ foto, moneda, onTotal, onFecha }) {
  const [estado, setEstado] = useState("quieto");
  const [avance, setAvance] = useState(0);
  const [leido, setLeido] = useState(null);
  const [dia, setDia] = useState(null);
  // Si quitas la foto a medio leer, lo que llegue luego ya no vale.
  const sigue = useRef(true);

  useEffect(() => {
    sigue.current = true;
    return () => {
      sigue.current = false;
    };
  }, []);

  useEffect(() => {
    if (estado === "leyendo") return;

    function alPulsar(e) {
      if (!esAtajoLeer(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      leer();
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  });

  async function leer() {
    setEstado("leyendo");
    setAvance(0);
    try {
      const texto = await leerFoto(foto, (p) => sigue.current && setAvance(p));
      if (!sigue.current) return;

      const total = totalDelTicket(texto);
      // La fecha va aparte: aunque no salga el total, el día ya te lo ahorras.
      const fecha = fechaDelTicket(texto, hoy());
      setLeido(total);
      setDia(fecha);
      if (fecha) onFecha?.(fecha);
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
        <span>🔍 {t("Leyendo el ticket…")} {Math.round(avance * 100)} %</span>
        <span className="leer-total-barra" aria-hidden="true">
          <span style={{ transform: `scaleX(${avance})` }} />
        </span>
      </div>
    );
  }

  return (
    <div className="leer-total">
      <button className="boton-foto" aria-keyshortcuts="L" onClick={leer}>
        🔍 {estado === "quieto" ? t("Leer el total") : t("Leer otra vez")}
      </button>
      {estado === "leido" && (
        <span className="leer-total-bien" role="status">
          ✓ {conMoneda(leido, moneda)}
          {dia && `, ${t("del {dia}", { dia: enCorto(dia) })}`}. {t("Revísalo antes de apuntarlo.")}
        </span>
      )}
      {estado === "nada" && (
        <span className="leer-total-mal" role="status">
          {t("No encuentro el total. Escríbelo tú.")}
          {dia && ` ${t("El día sí: {dia}.", { dia: enCorto(dia) })}`}
        </span>
      )}
      {estado === "fallo" && (
        <span className="leer-total-mal" role="alert">
          {t("No he podido leerlo. La primera vez hace falta conexión.")}
        </span>
      )}
    </div>
  );
}

export default LeerTotal;
