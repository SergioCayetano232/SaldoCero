// Pillar el "1500" que quería ser "15,00". Como con los repetidos, no se
// bloquea nada, solo se pregunta.

import { importeDeGasto } from "./calculos";

// Por debajo de esto no merece la pena preguntar, aunque sea diez veces lo normal.
const MINIMO = 100;
// Con tan pocos gastos no hay "lo normal", así que vale una cifra fija.
const POCOS = 3;
const SIN_HISTORIA = 1000;

// Raro es diez veces lo típico del viaje y el doble del más caro hasta ahora.
// Lo del más caro es por el hotel: si ya hubo uno de 400, otro de 450 no extraña.
export function pareceRaro(importe, gastos) {
  if (!(importe >= MINIMO)) return false;

  const importes = gastos.map(importeDeGasto).filter((n) => n > 0).sort((a, b) => a - b);
  if (importes.length < POCOS) return importe >= SIN_HISTORIA;

  const mediana = importes[Math.floor(importes.length / 2)];
  const maximo = importes[importes.length - 1];
  return importe >= mediana * 10 && importe > maximo * 2;
}
