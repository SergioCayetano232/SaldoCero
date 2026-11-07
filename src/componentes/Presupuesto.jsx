import { useEffect, useState } from "react";
import { conMoneda, leerImporte, simboloDe } from "../monedas";
import { estadoPresupuesto, textoPresupuesto, ritmoDeGasto, textoRitmo, quedaPorCabeza } from "../presupuesto";
import { esAtajoPresupuesto, esOrdenador } from "../teclado";
import { t } from "../idioma";

// La barra del presupuesto, dentro del recuadro del total.
// Fijo, se ve pero no se cambia: es lo que queda de un viaje cerrado.
function Presupuesto({ total, gastos = [], presupuesto, moneda, cuantos = 0, fijo = false, onGuardar }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");

  const cantidad = leerImporte(texto);
  const estado = estadoPresupuesto(total, presupuesto);
  const ritmo = ritmoDeGasto(gastos);
  const cabeza = quedaPorCabeza(estado, cuantos);

  function abrir() {
    setTexto(presupuesto ? String(presupuesto).replace(".", ",") : "");
    setEditando(true);
  }

  useEffect(() => {
    if (fijo || editando) return;

    function alPulsar(e) {
      if (!esAtajoPresupuesto(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      // Si no, la "p" se escribe en el campo al abrirse.
      e.preventDefault();
      setTexto(presupuesto ? String(presupuesto).replace(".", ",") : "");
      setEditando(true);
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [fijo, editando, presupuesto]);

  async function guardar(valor) {
    if (await onGuardar(valor)) setEditando(false);
  }

  if (editando) {
    return (
      <div className="presupuesto presupuesto-editando">
        <label className="presupuesto-campo">
          <span>{t("Como mucho")}</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="1000"
            enterKeyHint="done"
            value={texto}
            // Para cambiarlo escribes encima, sin borrar antes.
            onFocus={(e) => e.target.select()}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && cantidad) guardar(cantidad);
              if (e.key === "Escape") setEditando(false);
            }}
            autoFocus
          />
          <span>{simboloDe(moneda)}</span>
        </label>
        <div className="presupuesto-botones">
          <button onClick={() => guardar(cantidad)} disabled={!cantidad}>
            {t("Guardar")}
          </button>
          {presupuesto && <button onClick={() => guardar(null)}>{t("Quitar")}</button>}
          <button onClick={() => setEditando(false)}>{t("Cancelar")}</button>
        </div>
      </div>
    );
  }

  if (!estado) {
    if (fijo) return null;
    return (
      <button
        className="presupuesto-poner"
        onClick={abrir}
        aria-keyshortcuts="p"
        title={esOrdenador() ? t("También con la P") : undefined}
      >
        {t("+ Poner un presupuesto")}
      </button>
    );
  }

  return (
    <div className={`presupuesto ${estado.nivel}`}>
      <div
        className="presupuesto-barra"
        role="progressbar"
        aria-valuenow={estado.porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("Presupuesto gastado")}
      >
        <div className="presupuesto-relleno" style={{ width: `${estado.relleno * 100}%` }} />
      </div>
      <div className="presupuesto-pie">
        <span>
          {textoPresupuesto(estado, presupuesto, moneda)}
          {cabeza !== null && <span className="presupuesto-cabeza">{t("{cifra} cada uno", { cifra: conMoneda(cabeza, moneda) })}</span>}
        </span>
        <span className="presupuesto-tanto">{estado.porcentaje}%</span>
        {!fijo && (
          <button
            className="presupuesto-cambiar"
            onClick={abrir}
            title={esOrdenador() ? t("Cambiar el presupuesto (también con la P)") : t("Cambiar el presupuesto")}
            aria-keyshortcuts="p"
          >
            ✎
          </button>
        )}
      </div>
      {ritmo && <div className="presupuesto-ritmo">{textoRitmo(ritmo, estado, moneda, fijo)}</div>}
    </div>
  );
}

export default Presupuesto;
