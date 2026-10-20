// Cómo ha ido el saldo de cada uno día a día: quién estuvo adelantando dinero
// y cuándo se le dio la vuelta. Al final de cada día, con todo lo apuntado hasta ahí.
//
// Los pagos a cuenta no entran: no llevan fecha, y se hacen al volver.

import { gastoPorDia } from "./barras";
import { balancesConBote, sinBote } from "./bote";

const redondear = (n) => Math.round(n * 100) / 100;

export function evolucionDeSaldos(viajeros, gastos, aportaciones = []) {
  const dias = gastoPorDia(gastos).map((d) => d.fecha);
  // Con un día no hay evolución, y con uno solo no hay con quién estar en paz.
  if (dias.length < 2 || viajeros.length < 2) return null;

  const series = viajeros.map((v) => ({ id: v.id, nombre: v.nombre, saldos: [] }));

  for (const fecha of dias) {
    // Los de antes de las fechas no tienen día: cuentan desde el principio.
    const hastaAqui = gastos.filter((g) => !g.fecha || g.fecha <= fecha);
    const balances = sinBote(balancesConBote(viajeros, hastaAqui, [], aportaciones));
    for (const s of series) {
      s.saldos.push(redondear(balances.find((b) => b.id === s.id)?.balance ?? 0));
    }
  }

  // Sin eje no hace falta que sea redondo: el más alto llega arriba del todo.
  const mayor = Math.max(...series.flatMap((s) => s.saldos.map(Math.abs)));
  return { dias, series, tope: mayor > 0 ? mayor : 1 };
}

// "+40,00 €" o "−60,00 €". Con un menos de verdad, que el guion se ve escaso.
export function conSigno(saldo, formatear) {
  if (Math.abs(saldo) < 0.005) return formatear(0);
  return `${saldo > 0 ? "+" : "−"}${formatear(Math.abs(saldo))}`;
}

// El día más cercano a donde está el dedo, de 0 a 1 a lo ancho.
export function diaEn(posicion, cuantos) {
  return Math.min(cuantos - 1, Math.max(0, Math.round(posicion * (cuantos - 1))));
}
