// El bote común: cada uno pone dinero y los gastos se pagan de ahí.

import { calcularBalances, importeDeGasto } from "./calculos";

// Va de pagador en los gastos del bote. En la base de datos es un pagador null.
export const BOTE = "bote";

export function esDelBote(gasto) {
  return gasto.pagadorId === BOTE;
}

export function totalAportado(aportaciones) {
  return aportaciones.reduce((t, a) => t + a.importe, 0);
}

// Lo que queda dentro. Negativo si se ha pagado de más desde el bote.
export function enElBote(aportaciones, gastos) {
  const gastado = gastos.filter(esDelBote).reduce((t, g) => t + importeDeGasto(g), 0);
  return totalAportado(aportaciones) - gastado;
}

export function hayBote(aportaciones, gastos) {
  return aportaciones.length > 0 || gastos.some(esDelBote);
}

// Los balances de siempre, con el bote como uno más al final.
//
// Poner en el bote cuenta como haber pagado: luego sale de ahí lo de todos.
// Y el bote "debe" lo que le sobra, así que en los pagos sale "Bote → Ana" para
// devolverlo. No entra en los repartos: no come.
export function balancesConBote(viajeros, gastos, parciales = [], aportaciones = []) {
  const balances = calcularBalances(viajeros, gastos, parciales);
  if (!hayBote(aportaciones, gastos)) return balances;

  const puesto = new Map();
  for (const a of aportaciones) puesto.set(a.viajeroId, (puesto.get(a.viajeroId) ?? 0) + a.importe);

  const conLoSuyo = balances.map((v) => ({
    ...v,
    alBote: puesto.get(v.id) ?? 0,
    balance: v.balance + (puesto.get(v.id) ?? 0),
  }));

  // Lo de alguien que ya no está no se cuenta, que descuadraría al bote.
  const deLosQueEstan = aportaciones.filter((a) => balances.some((v) => v.id === a.viajeroId));

  return [
    ...conLoSuyo,
    {
      id: BOTE,
      nombre: "Bote",
      esBote: true,
      puesto: 0,
      tocaPagar: 0,
      dado: 0,
      recibido: 0,
      alBote: 0,
      balance: -enElBote(deLosQueEstan, gastos),
    },
  ];
}

// Solo las personas, para las listas donde el bote no pinta nada.
export function sinBote(balances) {
  return balances.filter((v) => !v.esBote);
}
