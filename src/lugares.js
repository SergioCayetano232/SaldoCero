// La ciudad de cada gasto, para los viajes de varias paradas: cuánto se fue en
// Roma y cuánto en Florencia.

import { importeDeGasto } from "./calculos";
import { normalizar } from "./filtros";

export const LARGO_LUGAR = 40;

// "  roma " → "Roma". Null si no queda nada.
export function limpiarLugar(texto) {
  const limpio = String(texto ?? "").replace(/\s+/g, " ").trim().slice(0, LARGO_LUGAR);
  if (!limpio) return null;
  return limpio[0].toLocaleUpperCase("es") + limpio.slice(1);
}

export function mismoLugar(a, b) {
  return Boolean(a && b) && normalizar(a) === normalizar(b);
}

// Las del viaje, la más usada primero. Con la forma en que se escribió la primera vez.
export function lugaresDelViaje(gastos) {
  const cuenta = new Map();
  for (const g of gastos) {
    if (!g.lugar) continue;
    const clave = normalizar(g.lugar);
    const antes = cuenta.get(clave);
    cuenta.set(clave, { lugar: antes?.lugar ?? g.lugar, veces: (antes?.veces ?? 0) + 1 });
  }
  return [...cuenta.values()].sort((a, b) => b.veces - a.veces).map((c) => c.lugar);
}

// Donde estáis ese día: lo último apuntado ese día, o si no, lo del último día
// de antes. Lo normal es pasar varios días en la misma ciudad.
export function lugarSugerido(gastos, fecha) {
  const conLugar = gastos.filter((g) => g.lugar && g.fecha && g.fecha <= fecha);
  if (conLugar.length === 0) return null;

  const masReciente = (a, b) =>
    a.fecha !== b.fecha ? (a.fecha > b.fecha ? a : b) : (a.creadoEn ?? "") >= (b.creadoEn ?? "") ? a : b;
  return conLugar.reduce(masReciente).lugar;
}

// Lo que se fue en cada sitio, con lo que no tiene lugar aparte. Vacío si no
// hay al menos dos sitios: con uno solo no hay nada que comparar.
export function porLugar(gastos) {
  const lugares = lugaresDelViaje(gastos);
  if (lugares.length < 2) return [];

  const filas = lugares.map((lugar) => {
    const suyos = gastos.filter((g) => mismoLugar(g.lugar, lugar));
    return { lugar, total: suyos.reduce((t, g) => t + importeDeGasto(g), 0), cuantos: suyos.length };
  });

  const sinLugar = gastos.filter((g) => !g.lugar);
  if (sinLugar.length) {
    filas.push({ lugar: null, total: sinLugar.reduce((t, g) => t + importeDeGasto(g), 0), cuantos: sinLugar.length });
  }

  return filas.sort((a, b) => (a.lugar === null) - (b.lugar === null) || b.total - a.total);
}
