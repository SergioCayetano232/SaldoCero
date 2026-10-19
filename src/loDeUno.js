// Los gastos vistos desde una persona: lo que pagó y lo que le tocaba.

import { importeDeGasto, parteDe } from "./calculos";
import { conMoneda } from "./monedas";
import { enCorto } from "./fechas";
import { enlaceDelViaje } from "./compartir";

export function cuentaDe(gastos, viajeroId, viajeros) {
  let pagado = 0;
  let leToca = 0;

  for (const gasto of gastos) {
    if (gasto.pagadorId === viajeroId) pagado += importeDeGasto(gasto);
    leToca += parteDe(gasto, viajeroId, viajeros);
  }

  return { pagado, leToca };
}

// "Pagaste 120.00 € · te tocan 80.00 €", o con el nombre si no eres tú.
export function textoCuentaDe(cuenta, nombre, esYo, moneda) {
  const pago = conMoneda(cuenta.pagado, moneda);
  const toca = conMoneda(cuenta.leToca, moneda);
  return esYo ? `Pagaste ${pago} · te tocan ${toca}` : `${nombre} pagó ${pago} · le tocan ${toca}`;
}

// Lo que sale al lado de cada gasto. Si lo pagó pero no iba en él, se dice,
// que si no parece que no tiene nada que ver.
export function textoParteDe(gasto, viajeroId, viajeros, esYo, moneda) {
  const parte = parteDe(gasto, viajeroId, viajeros);
  if (parte > 0) return `${esYo ? "te tocan" : "le tocan"} ${conMoneda(parte, moneda)}`;
  return esYo ? "lo pagaste, no ibas" : "lo pagó, no iba";
}

// Sus cuentas gasto a gasto, para mandárselas al que no se cree lo que debe.
// Si eres tú, en primera persona: es para enseñárselo tú a otro.
export function mensajeDeCuenta({ gastos, viajero, viajeros, esYo, nombreViaje, moneda, codigo, base }) {
  const suyos = gastos.filter((g) => g.pagadorId === viajero.id || parteDe(g, viajero.id, viajeros) > 0);
  const lineas = [esYo ? `Mis cuentas de *${nombreViaje}* 🧾` : `Hola ${viajero.nombre}! Tus cuentas de *${nombreViaje}* 🧾`, ""];

  for (const gasto of suyos) {
    const parte = parteDe(gasto, viajero.id, viajeros);
    const pago = gasto.pagadorId === viajero.id;
    const cuanto = conMoneda(importeDeGasto(gasto), moneda);
    const cuando = gasto.fecha ? `, ${enCorto(gasto.fecha)}` : "";

    let suyo;
    if (pago && parte > 0) suyo = `${esYo ? "lo pagué" : "lo pagaste"}, ${esYo ? "me tocan" : "te tocan"} ${conMoneda(parte, moneda)}`;
    else if (pago) suyo = esYo ? "lo pagué, no iba" : "lo pagaste, no ibas";
    else suyo = `${esYo ? "me tocan" : "te tocan"} ${conMoneda(parte, moneda)}`;

    lineas.push(`· ${gasto.concepto}${cuando} (${cuanto}): ${suyo}`);
  }

  const { pagado, leToca } = cuentaDe(suyos, viajero.id, viajeros);
  lineas.push("");
  lineas.push(
    esYo
      ? `En total pagué *${conMoneda(pagado, moneda)}* y me tocan *${conMoneda(leToca, moneda)}*`
      : `En total pagaste *${conMoneda(pagado, moneda)}* y te tocan *${conMoneda(leToca, moneda)}*`
  );

  if (codigo) lineas.push("", `Las cuentas, aquí: ${enlaceDelViaje(codigo, base)}`);

  return lineas.join("\n");
}
