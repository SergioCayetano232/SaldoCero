// Contar un gasto en el grupo: "Cena 60 €, sale a 15 € cada uno". Para que se
// enteren al momento sin tener que abrir la app.

import { importeDeGasto, participantesDeGasto, repartoDeGasto } from "./calculos";
import { categoriaDe } from "./categorias";
import { conMoneda } from "./monedas";
import { porCabeza } from "./porCabeza";
import { BOTE } from "./bote";
import { enlaceDelViaje } from "./compartir";

export function mensajeDeGasto({ gasto, viajeros, moneda, codigo, base }) {
  const pagador =
    gasto.pagadorId === BOTE
      ? "del bote"
      : `pagó ${viajeros.find((v) => v.id === gasto.pagadorId)?.nombre ?? "alguien"}`;

  // Si se pagó en otra moneda, las dos: la de verdad y la que cuenta.
  const otraMoneda = gasto.moneda && gasto.moneda !== moneda;
  const importe = otraMoneda
    ? `${conMoneda(gasto.importe, gasto.moneda)} (${conMoneda(importeDeGasto(gasto), moneda)})`
    : conMoneda(importeDeGasto(gasto), moneda);

  const lineas = [`${categoriaDe(gasto.categoria).emoji} *${gasto.concepto}*: ${importe}, ${pagador}`];

  const suyos = participantesDeGasto(gasto, viajeros);
  const cadaUno = porCabeza(gasto, viajeros);

  if (cadaUno !== null) {
    const entre = suyos.length === viajeros.length ? "entre todos" : `entre ${listaDeNombres(suyos)}`;
    lineas.push(`Sale a *${conMoneda(cadaUno, moneda)}* cada uno, ${entre}`);
  } else if (suyos.length > 1) {
    // A partes distintas no hay una cifra para todos: la de cada uno.
    const reparto = repartoDeGasto(gasto, suyos);
    for (const v of suyos) lineas.push(`· ${v.nombre}: ${conMoneda(reparto.get(v.id), moneda)}`);
  }

  if (gasto.nota) lineas.push(`_${gasto.nota}_`);
  if (codigo) lineas.push("", `Las cuentas, aquí: ${enlaceDelViaje(codigo, base)}`);

  return lineas.join("\n");
}

// "Ana, Luis y Marta"
function listaDeNombres(viajeros) {
  const nombres = viajeros.map((v) => v.nombre);
  if (nombres.length < 2) return nombres.join("");
  return `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
}
