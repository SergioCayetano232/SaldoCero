// Repartir por importes: "Ana 12 €, Luis 8 €" en vez de por partes.
//
// No se guarda aparte. Si cada uno lleva de peso lo que pone, el reparto por
// pesos ya da justo esa cifra, y en otra moneda el cambio se reparte igual.

// Medio céntimo: lo que se escapa al sumar decimales.
const MARGEN = 0.005;

const redondear = (n) => Math.round(n * 100) / 100;

// Lo que se ha escrito, como número. Vale con coma. Vacío o raro, cero.
export function leerImporte(texto) {
  const numero = parseFloat(String(texto ?? "").replace(",", "."));
  return isNaN(numero) || numero < 0 ? 0 : numero;
}

// Lo que queda por repartir. En negativo, es que se ha pasado.
export function loQueFalta(importes, ids, total) {
  const suma = ids.reduce((t, id) => t + leerImporte(importes[id]), 0);
  return redondear(total - suma);
}

export function cuadra(importes, ids, total) {
  return total > 0 && Math.abs(loQueFalta(importes, ids, total)) < MARGEN;
}

// Lo que se guarda: cada importe, tal cual, como su peso.
export function importesAPartes(importes, ids) {
  return Object.fromEntries(ids.map((id) => [id, redondear(leerImporte(importes[id]))]));
}

// Al revés, para pasar de partes a importes sin empezar de cero. Va en
// céntimos y el que sobra se lo lleva el que más decimales perdió, para que
// la suma dé justo el total.
export function partesAImportes(partes, ids, total) {
  const pesos = ids.map((id) => partes[id] ?? 1);
  const suma = pesos.reduce((t, p) => t + p, 0);
  if (!(total > 0) || suma <= 0) return {};

  const centimos = Math.round(total * 100);
  const exactos = pesos.map((p) => (centimos * p) / suma);
  const enteros = exactos.map(Math.floor);
  let sobran = centimos - enteros.reduce((t, c) => t + c, 0);

  const porResto = exactos
    .map((e, i) => [e - Math.floor(e), i])
    .sort((x, y) => y[0] - x[0]);
  for (const [, i] of porResto) {
    if (sobran <= 0) break;
    enteros[i] += 1;
    sobran -= 1;
  }

  return Object.fromEntries(ids.map((id, i) => [id, String(enteros[i] / 100)]));
}

// Si las partes de un gasto suman su importe, se apuntó por importes. Y si
// eran partes que da la casualidad de que suman eso, verlas en importes es lo mismo.
export function vanPorImportes(partes, importe) {
  const valores = Object.values(partes ?? {});
  if (!valores.some((p) => p !== 1)) return false;

  const suma = valores.reduce((t, p) => t + p, 0);
  return Math.abs(suma - importe) < MARGEN;
}
