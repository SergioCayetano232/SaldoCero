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
  return cuentaDeNeto(saldo.teDeben - saldo.debes, moneda);
}

// Lo neto ya hecho, que es lo que se guarda en "Tus viajes".
export function cuentaDeNeto(neto, moneda = "EUR") {
  if (typeof neto !== "number") return null;
  if (neto <= -0.005) return `debes ${conMoneda(-neto, moneda)}`;
  if (neto >= 0.005) return `te deben ${conMoneda(neto, moneda)}`;
  return null;
}

export function tituloDePestana(nombreDelViaje, cuenta = null) {
  const nombre = nombreDelViaje?.trim();
  if (!nombre) return TITULO_SIN_VIAJE;
  return cuenta ? `${nombre} · ${cuenta} · SaldoCero` : `${nombre} · SaldoCero`;
}

// Lo tuyo solo si has marcado quién eres y sigues en el viaje. Si no, null.
export function miNeto(viaje, soy) {
  if (!viaje || !soy || !viaje.viajeros.some((v) => v.id === soy)) return null;

  const balances = balancesConBote(viaje.viajeros, viaje.gastos, viaje.parciales, viaje.aportaciones);
  const saldo = miSaldo(pagosDelViaje(balances, viaje), soy);
  return Math.round((saldo.teDeben - saldo.debes) * 100) / 100;
}

export function tituloDelViaje(viaje, soy) {
  if (!viaje) return TITULO_SIN_VIAJE;
  return tituloDePestana(viaje.nombre, cuentaDeNeto(miNeto(viaje, soy), viaje.moneda ?? "EUR"));
}
