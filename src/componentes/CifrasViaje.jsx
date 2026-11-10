import { useEffect, useState } from "react";
import { cifrasDelViaje, cifrasEnTexto, cuantasVeces } from "../cifras";
import { sinBote } from "../bote";
import { copiarAlPortapapeles } from "../compartir";
import { conMoneda } from "../monedas";
import { enLista } from "../nombres";
import { enCorto } from "../fechas";
import { historiasDelViaje } from "../historias";
import { esAtajoHistorias, esOrdenador } from "../teclado";
import Cifra from "./Cifra";
import Historias from "./Historias";
import { t, tn } from "../idioma";
import { frenteAlAnterior } from "../anterior";

// Al cerrar el viaje, lo que dio de sí. Para enseñarlo en el grupo.
function CifrasViaje({ gastos, balances, nombre, moneda, anterior = null, pendientes = 0, verHistorias = false, onHistorias }) {
  const [copiado, setCopiado] = useState("");

  // En lo que puso cada uno también cuenta lo que metió en el bote.
  const personas = sinBote(balances).map((v) => ({ ...v, puesto: v.puesto + (v.alBote ?? 0) }));
  const cifras = cifrasDelViaje(gastos, personas, moneda);
  const hayCifras = Boolean(cifras);
  const frente = frenteAlAnterior(cifras, anterior, moneda);

  useEffect(() => {
    if (!hayCifras) return;

    function alPulsar(e) {
      if (!esAtajoHistorias(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      e.preventDefault();
      onHistorias?.(true);
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [hayCifras, onHistorias]);

  if (!cifras) return null;

  async function compartir() {
    const hecho = await copiarAlPortapapeles(cifrasEnTexto(cifras, nombre, moneda, frente));
    setCopiado(hecho ? "bien" : "mal");
    setTimeout(() => setCopiado(""), 2500);
  }

  const { quienMasPuso, quienMenosPuso, quienMasGasto, quienMasVeces, diaMasCaro, diaMasBarato, diaMasMovido, diaDeLaSemana, findeContraSemana, horaDeApuntar, trasnochado, gastoMasGrande, gastoMasPequeno, primerGasto, ultimoGasto, gordoDeCadaUno, diaDeCadaUno, laMitadEn, masCaroPorCabeza, masRepetido, delBote, tickets, notas, redondos, monedas, gordoDeFuera, deAlgunos, categoria, categoriaMasVeces, porPersonaYDia } = cifras;

  return (
    <section className="tarjeta cifras">
      <h2>
        <span className="icono">🏁</span> {t("El viaje en cifras")}
        <button className="boton-compartir" onClick={compartir} title={t("Copiar las cifras")}>
          {copiado === "bien" ? t("✓ Copiado") : copiado === "mal" ? t("No se ha podido") : t("Compartir")}
        </button>
      </h2>

      <button
        className="boton-historias"
        onClick={() => onHistorias?.(true)}
        aria-keyshortcuts="v"
        title={esOrdenador() ? t("También con la V") : undefined}
      >
        <span aria-hidden="true">▶</span> {t("Verlo en historias")}
      </button>

      {verHistorias && (
        <Historias
          historias={historiasDelViaje(cifras, { nombre, moneda, gastos, pendientes })}
          onCerrar={() => onHistorias?.(false)}
        />
      )}

      <div className="cifras-total">
        <span className="cifras-numero">
          <Cifra valor={cifras.total} moneda={moneda} />
        </span>
        <span className="cifras-pie">
          {tn(cifras.gastos, "en {n} gasto", "en {n} gastos")}
          {cifras.dias > 1 && ` ${t("y {n} días", { n: cifras.dias })}`}
          {cifras.media !== null && `, ${t("{cifra} de media", { cifra: conMoneda(cifras.media, moneda) })}`}
        </span>
      </div>

      <ul className="cifras-lista">
        {porPersonaYDia !== null && (
          <li>
            <span className="cifras-emoji">🧍</span>
            <strong>{conMoneda(porPersonaYDia, moneda)}</strong>
            <span>{t("por persona y día")}</span>
          </li>
        )}
        {frente && (
          <li>
            <span className="cifras-emoji">🔁</span>
            <strong>{frente.porcentaje === 0 ? "=" : `${frente.porcentaje > 0 ? "+" : "−"}${Math.abs(frente.porcentaje)} %`}</strong>
            <span>
              {frente.porDia
                ? t("frente a {nombre}, que salió a {cifra} por persona y día", { nombre: frente.nombre, cifra: conMoneda(frente.antes, moneda) })
                : t("frente a {nombre}, donde gastasteis {cifra}", { nombre: frente.nombre, cifra: conMoneda(frente.antes, moneda) })}
            </span>
          </li>
        )}
        {quienMasPuso && (
          <li>
            <span className="cifras-emoji">🏆</span>
            <strong>{quienMasPuso.nombre}</strong>
            <span>{t("el que más puso, {cifra}", { cifra: conMoneda(quienMasPuso.puesto, moneda) })}</span>
          </li>
        )}
        {quienMenosPuso && (
          <li>
            <span className="cifras-emoji">🤏</span>
            <strong>{quienMenosPuso.nombre}</strong>
            <span>{t("el que menos puso, {cifra}", { cifra: conMoneda(quienMenosPuso.puesto, moneda) })}</span>
          </li>
        )}
        {quienMasGasto && (
          <li>
            <span className="cifras-emoji">🍽️</span>
            <strong>{quienMasGasto.nombre}</strong>
            <span>{t("el que más gastó, {cifra}", { cifra: conMoneda(quienMasGasto.tocaPagar, moneda) })}</span>
          </li>
        )}
        {quienMasVeces && (
          <li>
            <span className="cifras-emoji">💳</span>
            <strong>{quienMasVeces.nombre}</strong>
            <span>{t("el que más veces pagó, {n} veces", { n: quienMasVeces.veces })}</span>
          </li>
        )}
        {diaMasCaro && (
          <li>
            <span className="cifras-emoji">📅</span>
            <strong>{enCorto(diaMasCaro.fecha)}</strong>
            <span>{t("el día más caro, {cifra}", { cifra: conMoneda(diaMasCaro.total, moneda) })}</span>
          </li>
        )}
        {diaMasBarato && (
          <li>
            <span className="cifras-emoji">🧘</span>
            <strong>{enCorto(diaMasBarato.fecha)}</strong>
            <span>{t("el día más tranquilo, {cifra}", { cifra: conMoneda(diaMasBarato.total, moneda) })}</span>
          </li>
        )}
        {diaMasMovido && (
          <li>
            <span className="cifras-emoji">🐝</span>
            <strong>{enCorto(diaMasMovido.fecha)}</strong>
            <span>{t("el día más movido, {n} gastos", { n: diaMasMovido.gastos })}</span>
          </li>
        )}
        {diaDeLaSemana && (
          <li>
            <span className="cifras-emoji">🗓️</span>
            <strong>{t("Los {dia}", { dia: diaDeLaSemana.dia })}</strong>
            <span>{t("es cuando más gastáis, {cifra} de media", { cifra: conMoneda(diaDeLaSemana.media, moneda) })}</span>
          </li>
        )}
        {findeContraSemana && (
          <li>
            <span className="cifras-emoji">🎉</span>
            <strong>{findeContraSemana.gana === "finde" ? t("Los findes") : t("Entre semana")}</strong>
            <span>
              {t("gastáis {veces}, {mas} al día contra {menos}", {
                veces: cuantasVeces(findeContraSemana.veces),
                mas: conMoneda(findeContraSemana.gana === "finde" ? findeContraSemana.finde : findeContraSemana.semana, moneda),
                menos: conMoneda(findeContraSemana.gana === "finde" ? findeContraSemana.semana : findeContraSemana.finde, moneda),
              })}
            </span>
          </li>
        )}
        {horaDeApuntar && (
          <li>
            <span className="cifras-emoji">{horaDeApuntar.emoji}</span>
            <strong>{horaDeApuntar.franja[0].toUpperCase() + horaDeApuntar.franja.slice(1)}</strong>
            <span>{t("es cuando más apuntáis, {veces} de {de} gastos", { veces: horaDeApuntar.veces, de: horaDeApuntar.de })}</span>
          </li>
        )}
        {trasnochado && (
          <li>
            <span className="cifras-emoji">🦉</span>
            <strong>{trasnochado.concepto}</strong>
            <span>
              {t("lo más trasnochado, a las {hora}", { hora: trasnochado.hora })}
              {trasnochado.quien && ` (${trasnochado.quien})`}
            </span>
          </li>
        )}
        <li>
          <span className="cifras-emoji">💸</span>
          <strong>{gastoMasGrande.concepto}</strong>
          <span>
            {t("el gasto más gordo, {cifra}", { cifra: conMoneda(gastoMasGrande.importe, moneda) })}
            {gastoMasGrande.quien && ` (${gastoMasGrande.quien})`}
          </span>
        </li>
        {primerGasto && (
          <>
            <li>
              <span className="cifras-emoji">🚀</span>
              <strong>{primerGasto.concepto}</strong>
              <span>{t("lo primero, {cifra}", { cifra: conMoneda(primerGasto.importe, moneda) })}</span>
            </li>
            <li>
              <span className="cifras-emoji">🏁</span>
              <strong>{ultimoGasto.concepto}</strong>
              <span>{t("lo último, {cifra}", { cifra: conMoneda(ultimoGasto.importe, moneda) })}</span>
            </li>
          </>
        )}
        {gordoDeCadaUno && (
          <li>
            <span className="cifras-emoji">🎯</span>
            <strong>{t("Lo más gordo de cada uno")}</strong>
            <span>
              {gordoDeCadaUno
                .map((c) => `${c.nombre}, ${c.concepto} (${conMoneda(c.importe, moneda)})`)
                .join(" · ")}
            </span>
          </li>
        )}
        {diaDeCadaUno && (
          <li>
            <span className="cifras-emoji">📆</span>
            <strong>{t("El día más caro de cada uno")}</strong>
            <span>
              {diaDeCadaUno.map((c) => `${c.nombre}: ${enCorto(c.fecha)} (${conMoneda(c.total, moneda)})`).join(" · ")}
            </span>
          </li>
        )}
        {gastoMasPequeno && (
          <li>
            <span className="cifras-emoji">🪙</span>
            <strong>{gastoMasPequeno.concepto}</strong>
            <span>
              {t("el más pequeño, {cifra}", { cifra: conMoneda(gastoMasPequeno.importe, moneda) })}
              {gastoMasPequeno.quien && ` (${gastoMasPequeno.quien})`}
            </span>
          </li>
        )}
        {masCaroPorCabeza && (
          <li>
            <span className="cifras-emoji">👤</span>
            <strong>{masCaroPorCabeza.concepto}</strong>
            <span>
              {t("lo más caro por cabeza, {cifra} cada uno (entre {n})", {
                cifra: conMoneda(masCaroPorCabeza.porCabeza, moneda),
                n: masCaroPorCabeza.cuantos,
              })}
            </span>
          </li>
        )}
        {laMitadEn && (
          <li>
            <span className="cifras-emoji">⚖️</span>
            <strong>{t("{n} de {de} gastos", { n: laMitadEn.gastos, de: laMitadEn.de })}</strong>
            <span>{t("se llevaron la mitad del dinero")}</span>
          </li>
        )}
        {masRepetido && (
          <li>
            <span className="cifras-emoji">🔁</span>
            <strong>{masRepetido.concepto}</strong>
            <span>
              {t("lo que más se repitió, {n} veces ({cifra})", { n: masRepetido.veces, cifra: conMoneda(masRepetido.total, moneda) })}
            </span>
          </li>
        )}
        {delBote && (
          <li>
            <span className="cifras-emoji">🫙</span>
            <strong>{conMoneda(delBote.total, moneda)}</strong>
            <span>
              {tn(delBote.gastos, "salieron del bote, en {n} gasto (el {tanto} %)", "salieron del bote, en {n} gastos (el {tanto} %)", {
                tanto: delBote.porcentaje,
              })}
            </span>
          </li>
        )}
        {monedas && (
          <li>
            <span className="cifras-emoji">🌍</span>
            <strong>{t("{n} monedas", { n: monedas.length })}</strong>
            <span>{t("en las que pagasteis: {cuales}", { cuales: enLista(monedas) })}</span>
          </li>
        )}
        {gordoDeFuera && (
          <li>
            <span className="cifras-emoji">💵</span>
            <strong>{gordoDeFuera.concepto}</strong>
            <span>
              {t("lo más caro en otra moneda, {pagado} ({cifra})", {
                pagado: conMoneda(gordoDeFuera.pagado, gordoDeFuera.moneda),
                cifra: conMoneda(gordoDeFuera.importe, moneda),
              })}
            </span>
          </li>
        )}
        {deAlgunos && (
          <li>
            <span className="cifras-emoji">👥</span>
            <strong>{tn(deAlgunos.deAlgunos, "{n} gasto", "{n} gastos")}</strong>
            <span>
              {tn(deAlgunos.deAlgunos, "de los {de} no fue entre todos", "de los {de} no fueron entre todos", { de: deAlgunos.gastos })}
            </span>
          </li>
        )}
        {tickets && (
          <li>
            <span className="cifras-emoji">🧾</span>
            <strong>{t("{n} de {de}", { n: tickets.conTicket, de: tickets.gastos })}</strong>
            <span>{tickets.gastos === 1 ? t("gasto con su ticket") : t("gastos con su ticket")}</span>
          </li>
        )}
        {redondos && (
          <li>
            <span className="cifras-emoji">💯</span>
            <strong>
              {/* "Todos" a secas ya es "Everyone" en el filtro, y aquí son gastos: "All". */}
              {redondos.redondos === redondos.gastos ? t("Todos{gastos}", { gastos: "" }) : t("{n} de {de}", { n: redondos.redondos, de: redondos.gastos })}
            </strong>
            <span>{redondos.redondos === redondos.gastos ? t("los gastos sin céntimos") : t("gastos sin céntimos")}</span>
          </li>
        )}
        {notas && (
          <li>
            <span className="cifras-emoji">🗒️</span>
            <strong>{t("{n} de {de}", { n: notas.conNota, de: notas.gastos })}</strong>
            <span>{notas.gastos === 1 ? t("gasto con su nota") : t("gastos con su nota")}</span>
          </li>
        )}
        {categoria && (
          <li>
            <span className="cifras-emoji">{categoria.emoji}</span>
            <strong>{t("{n} %", { n: categoria.porcentaje })}</strong>
            <span>{t("se fue en {categoria}", { categoria: t(categoria.nombre).toLowerCase() })}</span>
          </li>
        )}
        {categoriaMasVeces && (
          <li>
            <span className="cifras-emoji">{categoriaMasVeces.emoji}</span>
            <strong>{t("{n} gastos", { n: categoriaMasVeces.veces })}</strong>
            <span>{t("de {categoria}, la categoría estrella", { categoria: t(categoriaMasVeces.nombre).toLowerCase() })}</span>
          </li>
        )}
      </ul>
    </section>
  );
}

export default CifrasViaje;
