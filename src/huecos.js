// Los días del viaje en los que no hay nada apuntado, que al volver suele ser
// que alguien pagó y se le olvidó.

import { enCorto } from "./fechas";
import { enLista } from "./nombres";

const DIA = 86400000;

// Con más días que estos no es un viaje, es un gasto con la fecha mal puesta.
export const MAXIMO_DIAS = 31;

// Solo cuentan los días entre el primer gasto y el último: lo de después de
// volver ya lo avisa lo de cerrar el viaje.
export function diasSinGastos(gastos, descartados = []) {
  const fechas = [...new Set(gastos.map((g) => g.fecha).filter(Boolean))].sort();
  if (fechas.length < 2) return [];

  // En UTC, que con el cambio de hora un día puede durar 23 horas.
  const desde = Date.parse(fechas[0]);
  const hasta = Date.parse(fechas.at(-1));
  if ((hasta - desde) / DIA + 1 > MAXIMO_DIAS) return [];

  const huecos = [];
  for (let t = desde; t <= hasta; t += DIA) {
    const fecha = new Date(t).toISOString().slice(0, 10);
    if (!fechas.includes(fecha) && !descartados.includes(fecha)) huecos.push(fecha);
  }
  return huecos;
}

// Hasta tres días se dicen uno a uno. Más ya es una lista que nadie lee.
export function textoHuecos(huecos) {
  if (huecos.length === 0) return null;
  if (huecos.length > 3) return `Hay ${huecos.length} días sin nada apuntado, el primero el ${enCorto(huecos[0])}.`;

  const dias = enLista(huecos.map((f) => `el ${enCorto(f)}`));
  return `${dias[0].toUpperCase()}${dias.slice(1)} no hay nada apuntado.`;
}
