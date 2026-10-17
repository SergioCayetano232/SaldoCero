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
  const cifras = cifrasDelViaje(gastos, personas, moneda);
  if (!cifras) return null;

  async function compartir() {
    const hecho = await copiarAlPortapapeles(cifrasEnTexto(cifras, nombre, moneda));
    setCopiado(hecho ? "bien" : "mal");
    setTimeout(() => setCopiado(""), 2500);
  }

  const { quienMasPuso, quienMenosPuso, quienMasVeces, diaMasCaro, diaMasBarato, diaMasMovido, gastoMasGrande, gastoMasPequeno, masCaroPorCabeza, masRepetido, delBote, tickets, monedas, deAlgunos, categoria, porPersonaYDia } = cifras;

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
          {cifras.media !== null && `, ${conMoneda(cifras.media, moneda)} de media`}
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
        {quienMenosPuso && (
          <li>
            <span className="cifras-emoji">🤏</span>
            <strong>{quienMenosPuso.nombre}</strong>
            <span>el que menos puso, {conMoneda(quienMenosPuso.puesto, moneda)}</span>
          </li>
        )}
        {quienMasVeces && (
          <li>
            <span className="cifras-emoji">💳</span>
            <strong>{quienMasVeces.nombre}</strong>
            <span>el que más veces pagó, {quienMasVeces.veces} veces</span>
          </li>
        )}
        {diaMasCaro && (
          <li>
            <span className="cifras-emoji">📅</span>
            <strong>{enCorto(diaMasCaro.fecha)}</strong>
            <span>el día más caro, {conMoneda(diaMasCaro.total, moneda)}</span>
          </li>
        )}
        {diaMasBarato && (
          <li>
            <span className="cifras-emoji">🧘</span>
            <strong>{enCorto(diaMasBarato.fecha)}</strong>
            <span>el día más tranquilo, {conMoneda(diaMasBarato.total, moneda)}</span>
          </li>
        )}
        {diaMasMovido && (
          <li>
            <span className="cifras-emoji">🐝</span>
            <strong>{enCorto(diaMasMovido.fecha)}</strong>
            <span>el día más movido, {diaMasMovido.gastos} gastos</span>
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
        {gastoMasPequeno && (
          <li>
            <span className="cifras-emoji">🪙</span>
            <strong>{gastoMasPequeno.concepto}</strong>
            <span>
              el más pequeño, {conMoneda(gastoMasPequeno.importe, moneda)}
              {gastoMasPequeno.quien && ` (${gastoMasPequeno.quien})`}
            </span>
          </li>
        )}
        {masCaroPorCabeza && (
          <li>
            <span className="cifras-emoji">👤</span>
            <strong>{masCaroPorCabeza.concepto}</strong>
            <span>
              lo más caro por cabeza, {conMoneda(masCaroPorCabeza.porCabeza, moneda)} cada uno (entre{" "}
              {masCaroPorCabeza.cuantos})
            </span>
          </li>
        )}
        {masRepetido && (
          <li>
            <span className="cifras-emoji">🔁</span>
            <strong>{masRepetido.concepto}</strong>
            <span>
              lo que más se repitió, {masRepetido.veces} veces ({conMoneda(masRepetido.total, moneda)})
            </span>
          </li>
        )}
        {delBote && (
          <li>
            <span className="cifras-emoji">🫙</span>
            <strong>{conMoneda(delBote.total, moneda)}</strong>
            <span>
              salieron del bote, en {delBote.gastos} {delBote.gastos === 1 ? "gasto" : "gastos"} (el {delBote.porcentaje} %)
            </span>
          </li>
        )}
        {monedas && (
          <li>
            <span className="cifras-emoji">🌍</span>
            <strong>{monedas.length} monedas</strong>
            <span>en las que pagasteis: {monedas.join(", ")}</span>
          </li>
        )}
        {deAlgunos && (
          <li>
            <span className="cifras-emoji">👥</span>
            <strong>
              {deAlgunos.deAlgunos} {deAlgunos.deAlgunos === 1 ? "gasto" : "gastos"}
            </strong>
            <span>
              de los {deAlgunos.gastos} no {deAlgunos.deAlgunos === 1 ? "fue" : "fueron"} entre todos
            </span>
          </li>
        )}
        {tickets && (
          <li>
            <span className="cifras-emoji">🧾</span>
            <strong>
              {tickets.conTicket} de {tickets.gastos}
            </strong>
            <span>{tickets.gastos === 1 ? "gasto" : "gastos"} con su ticket</span>
          </li>
        )}
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
