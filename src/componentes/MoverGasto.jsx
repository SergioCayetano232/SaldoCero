import { useState } from "react";
import { t } from "../idioma";

// Debajo del gasto: a cuál de tus viajes lo pasas. Primero se mira si puede ir
// (que estén los mismos, la moneda...) y luego se confirma.
function MoverGasto({ gasto, destinos, preparar, onMover, onCerrar }) {
  const [listo, setListo] = useState(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function elegir(codigo) {
    setError("");
    setListo(null);
    setOcupado(true);
    const preparado = await preparar(gasto, codigo);
    setOcupado(false);
    if (preparado.error) setError(preparado.error);
    else setListo(preparado);
  }

  async function mover() {
    setOcupado(true);
    const bien = await onMover(gasto, listo.alli, listo.pasado);
    // Si ha ido bien, el gasto desaparece de aquí y esto con él.
    if (!bien) setOcupado(false);
  }

  return (
    <span className="mover-gasto" onKeyDown={(e) => e.key === "Escape" && onCerrar()}>
      <span className="mover-titulo">{t("¿A qué viaje lo pasas?")}</span>
      <span className="mover-destinos">
        {destinos.map((v) => (
          <button
            key={v.codigo}
            className={`pastilla-categoria ${listo?.alli.codigo === v.codigo ? "elegida" : ""}`}
            onClick={() => elegir(v.codigo)}
            disabled={ocupado}
          >
            {v.nombre}
          </button>
        ))}
      </span>

      {error && <span className="cobro-ayuda cobro-mal">{error}</span>}

      <span className="mover-botones">
        {listo && (
          <button className="boton-mover" onClick={mover} disabled={ocupado} autoFocus>
            {t("Pasar a {viaje}", { viaje: listo.alli.nombre })}
          </button>
        )}
        <button className="enlace" onClick={onCerrar}>
          {t("Cancelar")}
        </button>
      </span>
    </span>
  );
}

export default MoverGasto;
