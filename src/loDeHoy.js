// Lo que se lleva gastado hoy, para saber cómo va el día sin bajar a la lista.

import { calcularTotal } from "./calculos";
import { hoy } from "./fechas";

// null si hoy no hay nada, o si todo es de hoy: entonces ya lo dice el total.
export function gastadoHoy(gastos, dia = hoy()) {
  const deHoy = gastos.filter((g) => g.fecha === dia);
  if (deHoy.length === 0 || deHoy.length === gastos.length) return null;

  return { total: calcularTotal(deHoy), gastos: deHoy.length };
}
