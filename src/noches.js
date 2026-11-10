// Un alojamiento de varias noches, entre los que duermen cada una.
// La noche del viernes es del que está el viernes y sigue el sábado: el que se
// va el viernes no ha dormido allí.

import { estaEseDia } from "./estancia";

// Más de un mes en el mismo sitio ya no es un viaje.
export const MAX_NOCHES = 30;

// En UTC, que con el cambio de hora un día puede durar 23 horas.
export function masDias(fecha, n = 1) {
  const dia = new Date(`${fecha}T00:00:00Z`);
  dia.setUTCDate(dia.getUTCDate() + n);
  return dia.toISOString().slice(0, 10);
}

export function leerNoches(texto) {
  const n = Number(String(texto ?? "").trim());
  return Number.isInteger(n) && n >= 1 && n <= MAX_NOCHES ? n : null;
}

// Las noches de cada uno, empezando por la del día del gasto. Solo salen los
// que duermen alguna. Null si no duerme nadie: mejor eso que un reparto inventado.
export function nochesDeCadaUno(viajeros, primera, noches) {
  const cuantas = leerNoches(noches);
  if (!primera || !cuantas) return null;

  const suyas = {};
  for (let i = 0; i < cuantas; i++) {
    const noche = masDias(primera, i);
    const manana = masDias(noche);
    for (const v of viajeros) {
      if (estaEseDia(v, noche) && estaEseDia(v, manana)) suyas[v.id] = (suyas[v.id] ?? 0) + 1;
    }
  }

  return Object.keys(suyas).length ? suyas : null;
}

// Si todos duermen las mismas, es un reparto a partes iguales de toda la vida.
export function mismasNoches(suyas) {
  return new Set(Object.values(suyas ?? {})).size <= 1;
}
