// Las cuentas de la gráfica de gasto por día.

import { calcularTotal } from "./calculos";

const DIA = 86400000;

// Un día por barra, del primero al último. Los días sin gastos también salen,
// a cero: si no, un día de playa sin gastar nada desaparece y engaña.
export function gastoPorDia(gastos) {
  const conFecha = gastos.filter((g) => g.fecha);
  if (conFecha.length === 0) return [];

  const porFecha = new Map();
  for (const g of conFecha) {
    if (!porFecha.has(g.fecha)) porFecha.set(g.fecha, []);
    porFecha.get(g.fecha).push(g);
  }

  const fechas = [...porFecha.keys()].sort();
  // En UTC, que con el cambio de hora un día puede durar 23 horas.
  const desde = Date.parse(fechas[0]);
  const hasta = Date.parse(fechas[fechas.length - 1]);

  const dias = [];
  for (let t = desde; t <= hasta; t += DIA) {
    const fecha = new Date(t).toISOString().slice(0, 10);
    const suyos = porFecha.get(fecha) ?? [];
    dias.push({ fecha, total: calcularTotal(suyos), gastos: suyos.length });
  }
  return dias;
}

// El tope del eje, redondo: 1, 2, 2.5 o 5 por una potencia de diez.
// Así las marcas salen 0 / 50 / 100 y no 0 / 43,7 / 87,4.
export function topeRedondo(maximo) {
  if (!(maximo > 0)) return 1;

  const potencia = 10 ** Math.floor(Math.log10(maximo));
  const paso = [1, 2, 2.5, 5, 10].find((p) => p * potencia >= maximo);
  return paso * potencia;
}

// Qué días llevan su fecha debajo. Con muchos no caben todos: el primero, el
// último y unos cuantos repartidos en medio.
export function diasConEtiqueta(cuantos, maximo = 6) {
  if (cuantos <= maximo) return [...Array(cuantos).keys()];

  const salto = Math.ceil((cuantos - 1) / (maximo - 1));
  const elegidos = [];
  for (let i = 0; i < cuantos - 1; i += salto) elegidos.push(i);
  // Que el penúltimo no se pegue al último.
  if (cuantos - 1 - elegidos[elegidos.length - 1] < salto) elegidos.pop();
  elegidos.push(cuantos - 1);
  return elegidos;
}
