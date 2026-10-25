// El título de la pestaña. Con varias abiertas, o con la app instalada en el
// selector de apps, así sabes en qué viaje estás.

import { balancesConBote } from "./bote";
import { pagosDelViaje } from "./calculos";
import { miSaldo } from "./miSaldo";
import { conMoneda } from "./monedas";

export const TITULO_SIN_VIAJE = "SaldoCero · Reparte los gastos del viaje";

// En el título no cabe "debes tanto y te deben cuanto", así que va lo neto.
export function cuentaEnTitulo(saldo, moneda = "EUR") {
  if (!saldo) return null;
  const neto = saldo.teDeben - saldo.debes;
  if (neto <= -0.005) return `debes ${conMoneda(-neto, moneda)}`;
  if (neto >= 0.005) return `te deben ${conMoneda(neto, moneda)}`;
  return null;
}

export function tituloDePestana(nombreDelViaje, cuenta = null) {
  const nombre = nombreDelViaje?.trim();
  if (!nombre) return TITULO_SIN_VIAJE;
  return cuenta ? `${nombre} · ${cuenta} · SaldoCero` : `${nombre} · SaldoCero`;
}

// Lo tuyo solo si has marcado quién eres y sigues en el viaje.
export function tituloDelViaje(viaje, soy) {
  if (!viaje) return TITULO_SIN_VIAJE;
  if (!soy || !viaje.viajeros.some((v) => v.id === soy)) return tituloDePestana(viaje.nombre);

  const balances = balancesConBote(viaje.viajeros, viaje.gastos, viaje.parciales, viaje.aportaciones);
  const saldo = miSaldo(pagosDelViaje(balances, viaje), soy);
  return tituloDePestana(viaje.nombre, cuentaEnTitulo(saldo, viaje.moneda ?? "EUR"));
}
