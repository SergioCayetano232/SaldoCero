// Pillar la fecha mal puesta, que en el calendario del móvil es fácil quedarse
// en el año pasado. Como con los importes raros, no se bloquea nada.

import { hoy } from "./fechas";

// Un viaje no suele pasar de un mes. La reserva del hotel sí puede ir antes,
// pero eso ya se contesta con un "sí, está bien".
const LEJOS = 30;
// Sin gastos todavía no hay con qué comparar, solo con hoy. Más holgado, que
// hay quien apunta el viaje a la vuelta.
const LEJOS_DE_HOY = 60;

function diasEntre(a, b) {
  return Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000;
}

export function fechaRara(fecha, gastos, hoyEs = hoy()) {
  if (!fecha) return false;

  // Los de antes de que hubiera fecha no cuentan.
  const fechas = gastos.map((g) => g.fecha).filter(Boolean);
  if (fechas.length === 0) return diasEntre(fecha, hoyEs) > LEJOS_DE_HOY;

  return Math.min(...fechas.map((f) => diasEntre(fecha, f))) > LEJOS;
}

// Con el año, que suele ser justo lo que está mal.
export function fechaConAno(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
