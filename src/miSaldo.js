// Lo tuyo en una línea, arriba del resumen: si te deben o si debes.
// Sale de los pagos y no del balance, que así cuenta el redondeo y lo ya pagado.

import { conMoneda } from "./monedas";

export function miSaldo(pagos, soy) {
  if (!soy) return null;

  let debes = 0;
  let teDeben = 0;
  let tenias = false;

  for (const pago of pagos) {
    if (pago.deId !== soy && pago.aId !== soy) continue;
    tenias = true;
    if (pago.saldado) continue;
    if (pago.deId === soy) debes += pago.cantidad;
    else teDeben += pago.cantidad;
  }

  return { debes, teDeben, tenias };
}

// Con los dos a la vez no suele pasar, pero tras marcar pagos a medias puede.
export function textoMiSaldo(saldo, moneda) {
  if (!saldo) return null;

  const { debes, teDeben, tenias } = saldo;
  if (debes > 0 && teDeben > 0) {
    return `Debes ${conMoneda(debes, moneda)} y te deben ${conMoneda(teDeben, moneda)}`;
  }
  if (debes > 0) return `Debes ${conMoneda(debes, moneda)}`;
  if (teDeben > 0) return `Te deben ${conMoneda(teDeben, moneda)}`;
  return tenias ? "Lo tuyo ya está pagado" : "Estás en paz";
}

export function estadoMiSaldo(saldo) {
  if (!saldo) return null;
  if (saldo.debes > saldo.teDeben) return "debe";
  if (saldo.teDeben > saldo.debes) return "le-deben";
  return "en-paz";
}
