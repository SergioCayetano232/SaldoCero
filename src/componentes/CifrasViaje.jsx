import { useState } from "react";
import { cifrasDelViaje, cifrasEnTexto } from "../cifras";
import { sinBote } from "../bote";
import { copiarAlPortapapeles } from "../compartir";
import { conMoneda } from "../monedas";
import { enCorto } from "../fechas";
import Cifra from "./Cifra";

// Al cerrar el viaje, lo que dio de sí. Para enseñarlo en el grupo.
function CifrasViaje({ gastos, balances, nombre, moneda }) {
  const [copiado, setCopiado] = useState("");

  // En lo que puso cada uno también cuenta lo que metió en el bote.
  const personas = sinBote(balances).map((v) => ({ ...v, puesto: v.puesto + (v.alBote ?? 0) }));
  const cifras = cifrasDelViaje(gastos, personas);
  if (!cifras) return null;

  async function compartir() {
    const hecho = await copiarAlPortapapeles(cifrasEnTexto(cifras, nombre, moneda));
    setCopiado(hecho ? "bien" : "mal");
    setTimeout(() => setCopiado(""), 2500);
  }

  const { quienMasPuso, diaMasCaro, gastoMasGrande, categoria, porPersonaYDia } = cifras;

  return (
    <section className="tarjeta cifras">
      <h2>
        <span className="icono">🏁</span> El viaje en cifras
        <button className="boton-compartir" onClick={compartir} title="Copiar las cifras">
          {copiado === "bien" ? "✓ Copiado" : copiado === "mal" ? "No se ha podido" : "Compartir"}
        </button>
      </h2>

      <div className="cifras-total">
        <span className="cifras-numero">
          <Cifra valor={cifras.total} moneda={moneda} />
        </span>
        <span className="cifras-pie">
          en {cifras.gastos} {cifras.gastos === 1 ? "gasto" : "gastos"}
          {cifras.dias > 1 && ` y ${cifras.dias} días`}
        </span>
      </div>

      <ul className="cifras-lista">
        {porPersonaYDia !== null && (
          <li>
            <span className="cifras-emoji">🧍</span>
            <strong>{conMoneda(porPersonaYDia, moneda)}</strong>
            <span>por persona y día</span>
          </li>
        )}
        {quienMasPuso && (
          <li>
            <span className="cifras-emoji">🏆</span>
            <strong>{quienMasPuso.nombre}</strong>
            <span>el que más puso, {conMoneda(quienMasPuso.puesto, moneda)}</span>
          </li>
        )}
        {diaMasCaro && (
          <li>
            <span className="cifras-emoji">📅</span>
            <strong>{enCorto(diaMasCaro.fecha)}</strong>
            <span>el día más caro, {conMoneda(diaMasCaro.total, moneda)}</span>
          </li>
        )}
        <li>
          <span className="cifras-emoji">💸</span>
          <strong>{gastoMasGrande.concepto}</strong>
          <span>
            el gasto más gordo, {conMoneda(gastoMasGrande.importe, moneda)}
            {gastoMasGrande.quien && ` (${gastoMasGrande.quien})`}
          </span>
        </li>
        {categoria && (
          <li>
            <span className="cifras-emoji">{categoria.emoji}</span>
            <strong>{categoria.porcentaje} %</strong>
            <span>se fue en {categoria.nombre.toLowerCase()}</span>
          </li>
        )}
      </ul>
    </section>
  );
}

export default CifrasViaje;
