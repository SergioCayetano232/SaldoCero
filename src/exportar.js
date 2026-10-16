// Los gastos en una hoja de cálculo, para quien quiera echar sus propias cuentas.

import { importeDeGasto, parteDe, calcularTotal } from "./calculos";
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
    "Nota",
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
      g.nota ?? "",
      ...viajeros.map((v) => cifra(parteDe(g, v.id, viajeros))),
    ]);

  // Con una fila en blanco antes, que si no el Excel la mete al ordenar la tabla.
  // Lo pagado no se suma: cada uno puede ir en una moneda.
  const total = [
    "",
    "Total",
    "",
    "",
    "",
    "",
    cifra(calcularTotal(gastos)),
    "",
    ...viajeros.map((v) => cifra(gastos.reduce((t, g) => t + parteDe(g, v.id, viajeros), 0))),
  ];
  const alFinal = gastos.length > 0 ? [[], total] : [];

  return [cabecera, ...filas, ...alFinal].map((fila) => fila.map(celda).join(SEPARADOR)).join("\r\n");
}
