// Lo tuyo en una línea, arriba del resumen: si te deben o si debes.
// Sale de los pagos y no del balance, que así cuenta el redondeo y lo ya pagado.

import { conMoneda } from "./monedas";
import { pagaYo, cobroYo } from "./juntos";
import { t } from "./idioma";

export function miSaldo(pagos, soy) {
  if (!soy) return null;

  let debes = 0;
  let teDeben = 0;
  let tenias = false;

  for (const pago of pagos) {
    if (!pagaYo(pago, soy) && !cobroYo(pago, soy)) continue;
    tenias = true;
    if (pago.saldado) continue;
    if (pagaYo(pago, soy)) debes += pago.cantidad;
    else teDeben += pago.cantidad;
  }

  return { debes, teDeben, tenias };
}

// Con los dos a la vez no suele pasar, pero tras marcar pagos a medias puede.
export function textoMiSaldo(saldo, moneda) {
  if (!saldo) return null;

  const { debes, teDeben, tenias } = saldo;
  if (debes > 0 && teDeben > 0) {
    return t("Debes {debes} y te deben {teDeben}", { debes: conMoneda(debes, moneda), teDeben: conMoneda(teDeben, moneda) });
  }
  if (debes > 0) return t("Debes {cifra}", { cifra: conMoneda(debes, moneda) });
  if (teDeben > 0) return t("Te deben {cifra}", { cifra: conMoneda(teDeben, moneda) });
  return tenias ? t("Lo tuyo ya está pagado") : t("Estás en paz");
}

export function estadoMiSaldo(saldo) {
  if (!saldo) return null;
  if (saldo.debes > saldo.teDeben) return "debe";
  if (saldo.teDeben > saldo.debes) return "le-deben";
  return "en-paz";
}
