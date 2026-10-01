import { useState } from "react";
import { leerImporte, simboloDe } from "../monedas";
import { estadoPresupuesto, textoPresupuesto } from "../presupuesto";

// La barra del presupuesto, dentro del recuadro del total.
// Fijo, se ve pero no se cambia: es lo que queda de un viaje cerrado.
function Presupuesto({ total, presupuesto, moneda, fijo = false, onGuardar }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");

  const cantidad = leerImporte(texto);
  const estado = estadoPresupuesto(total, presupuesto);

  function abrir() {
    setTexto(presupuesto ? String(presupuesto).replace(".", ",") : "");
    setEditando(true);
  }

  async function guardar(valor) {
    if (await onGuardar(valor)) setEditando(false);
  }

  if (editando) {
    return (
      <div className="presupuesto presupuesto-editando">
        <label className="presupuesto-campo">
          <span>Como mucho</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="1000"
            value={texto}
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
            Guardar
          </button>
          {presupuesto && <button onClick={() => guardar(null)}>Quitar</button>}
          <button onClick={() => setEditando(false)}>Cancelar</button>
        </div>
      </div>
    );
  }

  if (!estado) {
    if (fijo) return null;
    return (
      <button className="presupuesto-poner" onClick={abrir}>
        + Poner un presupuesto
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
        aria-label="Presupuesto gastado"
      >
        <div className="presupuesto-relleno" style={{ width: `${estado.relleno * 100}%` }} />
      </div>
      <div className="presupuesto-pie">
        <span>{textoPresupuesto(estado, presupuesto, moneda)}</span>
        <span className="presupuesto-tanto">{estado.porcentaje}%</span>
        {!fijo && (
          <button className="presupuesto-cambiar" onClick={abrir} title="Cambiar el presupuesto">
            ✎
          </button>
        )}
      </div>
    </div>
  );
}

export default Presupuesto;
