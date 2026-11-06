import { porLugar } from "../lugares";
import { conMoneda } from "../monedas";
import { t } from "../idioma";

// Cuánto se fue en cada ciudad. Solo sale si hay al menos dos.
function PorLugar({ gastos, moneda }) {
  const filas = porLugar(gastos);
  if (filas.length === 0) return null;

  const mayor = Math.max(...filas.map((f) => f.total), 0);

  return (
    <div className="por-lugar">
      <h3>📍 {t("Por ciudad")}</h3>
      <ul>
        {filas.map((f) => (
          <li key={f.lugar ?? "sin-lugar"} className={f.lugar ? "" : "sin-lugar"}>
            <span className="por-lugar-nombre">{f.lugar ?? t("Sin ciudad")}</span>
            <span className="por-lugar-barra" aria-hidden="true">
              <span style={{ width: `${mayor > 0 ? Math.max(0, (f.total / mayor) * 100) : 0}%` }} />
            </span>
            <span className="por-lugar-total">{conMoneda(f.total, moneda)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PorLugar;
