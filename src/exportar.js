// Los gastos en una hoja de cálculo, para quien quiera echar sus propias cuentas.

import { importeDeGasto, parteDe, calcularTotal } from "./calculos";
import { categoriaDe } from "./categorias";
import { BOTE } from "./bote";

// Punto y coma y coma decimal: así es como lo abre bien el Excel en español.
const SEPARADOR = ";";

function cifra(numero) {
  return numero.toFixed(2).replace(".", ",");
}

// "2026-10-17 20:30", en la hora de aquí, como las fechas de los gastos.
function momento(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// El nombre del viaje y sus días, para que el archivo se entienda sin abrir la app.
// Con una fila en blanco detrás, por lo mismo que la del total.
function arriba(nombre, gastos) {
  if (!nombre) return [];

  const dias = gastos.map((g) => g.fecha).filter(Boolean).sort();
  const desde = dias[0];
  const hasta = dias.at(-1);
  const cuando = !desde ? "" : desde === hasta ? desde : `del ${desde} al ${hasta}`;

  return [[nombre, cuando], []];
}

// Entre comillas si hace falta. Y si empieza por = + - @, Excel lo tomaría por
// una fórmula: con un apóstrofo delante se queda en texto.
export function celda(valor) {
  let texto = String(valor ?? "");
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  if (/[;"\n\r]/.test(texto)) texto = `"${texto.replaceAll('"', '""')}"`;
  return texto;
}

export function gastosEnCSV({ gastos, viajeros, moneda, nombre, pagos }) {
  const cabecera = [
    "Fecha",
    "Concepto",
    "Categoría",
    "Pagó",
    "Importe",
    "Moneda",
    `Importe en ${moneda}`,
    "Nota",
    "Ticket",
    "Apuntado",
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
      // La foto no cabe en un Excel, pero así sabes cuáles tienen justificante.
      g.ticket ? "Sí" : "No",
      // Los gastos de antes no lo guardaban.
      momento(g.creadoEn),
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
    "",
    "",
    ...viajeros.map((v) => cifra(gastos.reduce((t, g) => t + parteDe(g, v.id, viajeros), 0))),
  ];
  const alFinal = gastos.length > 0 ? [[], total, ...comoQuedan(pagos, moneda)] : [];

  return [...arriba(nombre, gastos), cabecera, ...filas, ...alFinal].map((fila) => fila.map(celda).join(SEPARADOR)).join("\r\n");
}

// Cómo quedan las cuentas, debajo de todo. Separado por dos filas, que es otra
// tabla y si no el Excel la junta con la de arriba.
function comoQuedan(pagos, moneda) {
  if (!pagos) return [];
  if (pagos.length === 0) return [[], [], ["Quién paga a quién"], ["Nadie debe nada"]];

  return [
    [],
    [],
    ["Quién paga a quién"],
    ["Paga", "Cobra", `Cantidad en ${moneda}`, "Estado"],
    ...pagos.map((p) => [p.de, p.a, cifra(p.cantidad), p.saldado ? "Pagado" : "Pendiente"]),
  ];
}
