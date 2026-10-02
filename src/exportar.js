// Los gastos en una hoja de cálculo, para quien quiera echar sus propias cuentas.

import { importeDeGasto, parteDe } from "./calculos";
import { categoriaDe } from "./categorias";
import { BOTE } from "./bote";

// Punto y coma y coma decimal: así es como lo abre bien el Excel en español.
const SEPARADOR = ";";

function cifra(numero) {
  return numero.toFixed(2).replace(".", ",");
}

// Entre comillas si hace falta. Y si empieza por = + - @, Excel lo tomaría por
// una fórmula: con un apóstrofo delante se queda en texto.
export function celda(valor) {
  let texto = String(valor ?? "");
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  if (/[;"\n\r]/.test(texto)) texto = `"${texto.replaceAll('"', '""')}"`;
  return texto;
}

export function gastosEnCSV({ gastos, viajeros, moneda }) {
  const cabecera = [
    "Fecha",
    "Concepto",
    "Categoría",
    "Pagó",
    "Importe",
    "Moneda",
    `Importe en ${moneda}`,
    // Lo que le toca a cada uno de cada gasto, para poder rehacer las cuentas.
    ...viajeros.map((v) => v.nombre),
  ];

  const filas = [...gastos]
    .sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""))
    .map((g) => [
      g.fecha ?? "",
      g.concepto,
      categoriaDe(g.categoria).nombre,
      g.pagadorId === BOTE ? "Bote" : viajeros.find((v) => v.id === g.pagadorId)?.nombre ?? "",
      cifra(g.importe),
      g.moneda ?? moneda,
      cifra(importeDeGasto(g)),
      ...viajeros.map((v) => cifra(parteDe(g, v.id, viajeros))),
    ]);

  return [cabecera, ...filas].map((fila) => fila.map(celda).join(SEPARADOR)).join("\r\n");
}
