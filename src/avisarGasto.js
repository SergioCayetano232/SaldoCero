// Contar un gasto en el grupo: "Cena 60 €, sale a 15 € cada uno". Para que se
// enteren al momento sin tener que abrir la app.

import { importeDeGasto, participantesDeGasto, repartoDeGasto } from "./calculos";
import { categoriaDe } from "./categorias";
import { conMonedaDeVerdad as conMoneda } from "./monedas";
import { porCabeza } from "./porCabeza";
import { BOTE } from "./bote";
import { enlaceDelViaje } from "./compartir";
import { enLista } from "./nombres";
import { nombreDeQuienPago, idsDeQuienPago } from "./pagadores";
import { t } from "./idioma";

export function mensajeDeGasto({ gasto, viajeros, moneda, codigo, base }) {
  const quien = nombreDeQuienPago(gasto, viajeros) || t("alguien");
  const pagador =
    gasto.pagadorId === BOTE
      ? t("del bote")
      : idsDeQuienPago(gasto).length > 1
        ? t("pagaron {quien}", { quien })
        : t("pagó {quien}", { quien });

  // Si se pagó en otra moneda, las dos: la de verdad y la que cuenta.
  const otraMoneda = gasto.moneda && gasto.moneda !== moneda;
  const importe = otraMoneda
    ? `${conMoneda(gasto.importe, gasto.moneda)} (${conMoneda(importeDeGasto(gasto), moneda)})`
    : conMoneda(importeDeGasto(gasto), moneda);

  const lineas = [`${categoriaDe(gasto.categoria).emoji} *${gasto.concepto}*: ${importe}, ${pagador}`];

  const suyos = participantesDeGasto(gasto, viajeros);
  const cadaUno = porCabeza(gasto, viajeros);

  if (cadaUno !== null) {
    const entre = suyos.length === viajeros.length ? t("entre todos") : t("entre {quienes}", { quienes: enLista(suyos.map((v) => v.nombre)) });
    lineas.push(t("Sale a *{cifra}* cada uno, {entre}", { cifra: conMoneda(cadaUno, moneda), entre }));
  } else if (suyos.length > 1) {
    // A partes distintas no hay una cifra para todos: la de cada uno.
    const reparto = repartoDeGasto(gasto, suyos);
    for (const v of suyos) lineas.push(`· ${v.nombre}: ${conMoneda(reparto.get(v.id), moneda)}`);
  }

  if (gasto.nota) lineas.push(`_${gasto.nota}_`);
  if (codigo) lineas.push("", t("Las cuentas, aquí: {enlace}", { enlace: enlaceDelViaje(codigo, base) }));

  return lineas.join("\n");
}
