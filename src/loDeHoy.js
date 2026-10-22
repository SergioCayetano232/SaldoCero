// Lo que se lleva gastado hoy, para saber cómo va el día sin bajar a la lista.

import { calcularTotal } from "./calculos";
import { hoy } from "./fechas";
import { conMoneda } from "./monedas";

// null si hoy no hay nada, o si todo es de hoy: entonces ya lo dice el total.
export function gastadoHoy(gastos, dia = hoy()) {
  const deHoy = gastos.filter((g) => g.fecha === dia);
  if (deHoy.length === 0 || deHoy.length === gastos.length) return null;

  return { total: calcularTotal(deHoy), gastos: deHoy.length };
}

// Lo de hoy menos lo de ayer. null si ayer no se apuntó nada: no hay con qué comparar.
export function frenteAAyer(gastos, dia = hoy()) {
  const deAyer = gastos.filter((g) => g.fecha === diaAntes(dia));
  if (deAyer.length === 0) return null;

  const deHoy = gastos.filter((g) => g.fecha === dia);
  return Math.round((calcularTotal(deHoy) - calcularTotal(deAyer)) * 100) / 100;
}

export function textoFrenteAAyer(diferencia, moneda) {
  if (diferencia === null) return null;
  if (diferencia === 0) return "lo mismo que ayer";
  return `${conMoneda(Math.abs(diferencia), moneda)} ${diferencia > 0 ? "más" : "menos"} que ayer`;
}

// En UTC para que el cambio de hora no se coma un día.
function diaAntes(dia) {
  const fecha = new Date(`${dia}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() - 1);
  return fecha.toISOString().slice(0, 10);
}
