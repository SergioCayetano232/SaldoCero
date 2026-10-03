// Los gastos vistos desde una persona: lo que pagó y lo que le tocaba.

import { importeDeGasto, parteDe } from "./calculos";
import { conMoneda } from "./monedas";

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
