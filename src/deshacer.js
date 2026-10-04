// Borrar con posibilidad de arrepentirse.
//
// En vez de borrar y guardar una copia por si acaso, esperamos unos segundos
// antes de borrar de verdad. Así deshacer es solo cancelar: no puede fallar,
// porque no ha pasado nada todavía.

import { conMoneda } from "./monedas";
import { calcularTotal } from "./calculos";

export const ESPERA = 5000;

// Devuelve con qué cancelarlo y con qué adelantarlo.
export function borradoConEspera(borrar, alTerminar) {
  let hecho = false;

  const reloj = setTimeout(async () => {
    hecho = true;
    try {
      await borrar();
      alTerminar?.(null);
    } catch (fallo) {
      alTerminar?.(fallo);
    }
  }, ESPERA);

  return {
    // Me he arrepentido: que no se borre.
    cancelar() {
      if (hecho) return false;
      clearTimeout(reloj);
      hecho = true;
      return true;
    },

    // Que se borre ya, sin esperar.
    async ahora() {
      if (hecho) return;
      clearTimeout(reloj);
      hecho = true;
      try {
        await borrar();
        alTerminar?.(null);
      } catch (fallo) {
        alTerminar?.(fallo);
      }
    },
  };
}

// Al quitar a alguien se van con él los gastos que pagó (la base de datos los
// borra en cascada). Que se diga, que si no parece que solo se va el nombre.
export function queSeVaConViajero(viajero, gastos, moneda = "EUR") {
  const suyos = gastos.filter((g) => g.pagadorId === viajero.id);
  if (suyos.length === 0) return `a ${viajero.nombre}`;

  const total = conMoneda(calcularTotal(suyos), moneda);
  if (suyos.length === 1) return `a ${viajero.nombre} y el gasto que pagó (${total})`;
  return `a ${viajero.nombre} y los ${suyos.length} gastos que pagó (${total})`;
}
