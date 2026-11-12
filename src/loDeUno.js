// Los gastos vistos desde una persona: lo que pagó y lo que le tocaba.

import { importeDeGasto, parteDe, loQuePuso } from "./calculos";
import { pagoEnElGasto } from "./pagadores";
import { conMoneda, conMonedaDeVerdad } from "./monedas";
import { enCorto } from "./fechas";
import { enlaceDelViaje } from "./compartir";
import { t } from "./idioma";

export function cuentaDe(gastos, viajeroId, viajeros) {
  let pagado = 0;
  let leToca = 0;

  for (const gasto of gastos) {
    pagado += loQuePuso(gasto, viajeros).get(viajeroId) ?? 0;
    leToca += parteDe(gasto, viajeroId, viajeros);
  }

  return { pagado, leToca };
}

// "Pagaste 120.00 € · te tocan 80.00 €", o con el nombre si no eres tú.
export function textoCuentaDe(cuenta, nombre, esYo, moneda) {
  const pago = conMoneda(cuenta.pagado, moneda);
  const toca = conMoneda(cuenta.leToca, moneda);
  return esYo ? t("Pagaste {pago} · te tocan {toca}", { pago, toca }) : t("{nombre} pagó {pago} · le tocan {toca}", { nombre, pago, toca });
}

// Lo que sale al lado de cada gasto. Si lo pagó pero no iba en él, se dice,
// que si no parece que no tiene nada que ver.
export function textoParteDe(gasto, viajeroId, viajeros, esYo, moneda) {
  const parte = parteDe(gasto, viajeroId, viajeros);
  if (parte > 0) return esYo ? t("te tocan {cifra}", { cifra: conMoneda(parte, moneda) }) : t("le tocan {cifra}", { cifra: conMoneda(parte, moneda) });
  return esYo ? t("lo pagaste, no ibas") : t("lo pagó, no iba");
}

// Sus cuentas gasto a gasto, para mandárselas al que no se cree lo que debe.
// Si eres tú, en primera persona: es para enseñárselo tú a otro.
export function mensajeDeCuenta({ gastos, viajero, viajeros, esYo, nombreViaje, moneda, codigo, base }) {
  const suyos = gastos.filter((g) => pagoEnElGasto(g, viajero.id) || parteDe(g, viajero.id, viajeros) > 0);
  const lineas = [
    esYo ? t("Mis cuentas de *{viaje}* 🧾", { viaje: nombreViaje }) : t("Hola {nombre}! Tus cuentas de *{viaje}* 🧾", { nombre: viajero.nombre, viaje: nombreViaje }),
    "",
  ];

  for (const gasto of suyos) {
    const parte = parteDe(gasto, viajero.id, viajeros);
    const pago = pagoEnElGasto(gasto, viajero.id);
    const cuanto = conMonedaDeVerdad(importeDeGasto(gasto), moneda);
    const cuando = gasto.fecha ? `, ${enCorto(gasto.fecha)}` : "";

    const cifra = conMonedaDeVerdad(parte, moneda);
    let suyo;
    if (pago && parte > 0) suyo = esYo ? t("lo pagué, me tocan {cifra}", { cifra }) : t("lo pagaste, te tocan {cifra}", { cifra });
    else if (pago) suyo = esYo ? t("lo pagué, no iba") : t("lo pagaste, no ibas");
    else suyo = esYo ? t("me tocan {cifra}", { cifra }) : t("te tocan {cifra}", { cifra });

    lineas.push(`· ${gasto.concepto}${cuando} (${cuanto}): ${suyo}`);
  }

  const { pagado, leToca } = cuentaDe(suyos, viajero.id, viajeros);
  lineas.push("");
  lineas.push(
    esYo
      ? t("En total pagué *{pagado}* y me tocan *{toca}*", { pagado: conMonedaDeVerdad(pagado, moneda), toca: conMonedaDeVerdad(leToca, moneda) })
      : t("En total pagaste *{pagado}* y te tocan *{toca}*", { pagado: conMonedaDeVerdad(pagado, moneda), toca: conMonedaDeVerdad(leToca, moneda) })
  );

  if (codigo) lineas.push("", t("Las cuentas, aquí: {enlace}", { enlace: enlaceDelViaje(codigo, base) }));

  return lineas.join("\n");
}
