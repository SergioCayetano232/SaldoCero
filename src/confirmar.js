// Que el que cobra diga que le ha llegado. Cualquiera puede marcar una deuda
// como pagada, pero si no es el que cobra, se queda "por confirmar" hasta que
// él lo vea. Cuenta como pagada igual: es un aviso, no un bloqueo.

import { BOTE } from "./bote";
import { cobroYo } from "./juntos";
import { t } from "./idioma";

// Si lo marca el que cobra, ya está confirmado. El bote no tiene a quién preguntar.
export function confirmadoAlMarcar(pago, soy) {
  return pago.deId === BOTE || pago.aId === BOTE || cobroYo(pago, soy);
}

export function puedeConfirmar(pago, soy) {
  return Boolean(pago.porConfirmar) && cobroYo(pago, soy);
}

export function textoPorConfirmar(pago, soy) {
  if (cobroYo(pago, soy)) return t("¿Te ha llegado?");
  return t("Falta que {nombre} confirme que le ha llegado", { nombre: pago.a });
}

export function cuantosPorConfirmar(pagos) {
  return pagos.filter((p) => p.porConfirmar).length;
}
