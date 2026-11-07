// Los gastos en una hoja de cálculo, para quien quiera echar sus propias cuentas.

import { importeDeGasto, parteDe, calcularTotal, loQuePuso } from "./calculos";
import { nombreDeQuienPago } from "./pagadores";
import { categoriaDe, gastoPorCategoria } from "./categorias";
import { BOTE } from "./bote";
import { t, idiomaActual, formatoFechas } from "./idioma";

// Punto y coma y coma decimal: así es como lo abre bien el Excel en español.
// El de inglés quiere comas y punto, o te mete la fila entera en una celda.
export function formatoCSV(idioma = idiomaActual()) {
  return idioma === "es" ? { separador: ";", decimal: "," } : { separador: ",", decimal: "." };
}

function cifra(numero) {
  return numero.toFixed(2).replace(".", formatoCSV().decimal);
}

// "2026-10-17 20:30", en la hora de aquí, como las fechas de los gastos.
function momento(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// "sábado", para poder filtrar los findes en el Excel sin fórmulas. A mediodía,
// que a medianoche un cambio de hora te lo pasa al día anterior.
function diaDeLaSemana(fecha) {
  if (!fecha) return "";
  return new Date(`${fecha}T12:00:00`).toLocaleDateString(formatoFechas(), { weekday: "long" });
}

// El nombre del viaje y sus días, para que el archivo se entienda sin abrir la app.
// Con una fila en blanco detrás, por lo mismo que la del total.
function arriba(nombre, gastos, deCuantos) {
  if (!nombre) return [];

  const dias = gastos.map((g) => g.fecha).filter(Boolean).sort();
  const desde = dias[0];
  const hasta = dias.at(-1);
  const cuando = !desde ? "" : desde === hasta ? desde : t("del {desde} al {hasta}", { desde, hasta });
  // Si es lo filtrado, que se diga: si no, parece el viaje entero.
  const parte = deCuantos > gastos.length ? [t("Solo {n} de {de} gastos", { n: gastos.length, de: deCuantos })] : [];

  return [[nombre, cuando, ...parte], []];
}

// Entre comillas si hace falta. Y si empieza por = + - @, Excel lo tomaría por
// una fórmula: con un apóstrofo delante se queda en texto.
export function celda(valor, separador = ";") {
  let texto = String(valor ?? "");
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  if (texto.includes(separador) || /["\n\r]/.test(texto)) texto = `"${texto.replaceAll('"', '""')}"`;
  return texto;
}

export function gastosEnCSV({ gastos, viajeros, moneda, nombre, pagos, deCuantos }) {
  const cabecera = [
    t("Fecha"),
    t("Día"),
    t("Concepto"),
    t("Categoría"),
    t("Pagó"),
    t("Importe"),
    t("Moneda"),
    t("Importe en {moneda}", { moneda }),
    t("Nota"),
    t("Ticket"),
    t("Apuntado"),
    // Lo que le toca a cada uno de cada gasto, para poder rehacer las cuentas.
    ...viajeros.map((v) => v.nombre),
  ];

  const filas = [...gastos]
    .sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""))
    .map((g) => [
      g.fecha ?? "",
      diaDeLaSemana(g.fecha),
      g.concepto,
      t(categoriaDe(g.categoria).nombre),
      g.pagadorId === BOTE ? t("Bote") : nombreDeQuienPago(g, viajeros),
      cifra(g.importe),
      g.moneda ?? moneda,
      cifra(importeDeGasto(g)),
      g.nota ?? "",
      // La foto no cabe en un Excel, pero así sabes cuáles tienen justificante.
      g.ticket ? t("Sí") : t("No"),
      // Los gastos de antes no lo guardaban.
      momento(g.creadoEn),
      ...viajeros.map((v) => cifra(parteDe(g, v.id, viajeros))),
    ]);

  // Con una fila en blanco antes, que si no el Excel la mete al ordenar la tabla.
  // Lo pagado no se suma: cada uno puede ir en una moneda.
  const total = [
    "",
    "",
    t("Total"),
    "",
    "",
    "",
    "",
    cifra(calcularTotal(gastos)),
    "",
    "",
    "",
    ...viajeros.map((v) => cifra(gastos.reduce((suma, g) => suma + parteDe(g, v.id, viajeros), 0))),
  ];
  // Lo pagado del bote no sale aquí, que no lo puso nadie de su bolsillo.
  const puso = [
    "",
    "",
    t("Puso"),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ...viajeros.map((v) => cifra(gastos.reduce((suma, g) => suma + (loQuePuso(g, viajeros).get(v.id) ?? 0), 0))),
  ];
  const alFinal = gastos.length > 0 ? [[], total, puso, ...porCategoria(gastos, moneda), ...comoQuedan(pagos, moneda)] : [];

  const { separador } = formatoCSV();
  return [...arriba(nombre, gastos, deCuantos), cabecera, ...filas, ...alFinal]
    .map((fila) => fila.map((valor) => celda(valor, separador)).join(separador))
    .join("\r\n");
}

// Lo de cada categoría, ya sumado, que es lo primero que se hace con la columna.
// Con una sola no hace falta: es el total otra vez.
function porCategoria(gastos, moneda) {
  const categorias = gastoPorCategoria(gastos, importeDeGasto);
  if (categorias.length < 2) return [];

  const suma = categorias.reduce((total, c) => total + c.total, 0);
  return [
    [],
    [],
    [t("En qué se fue")],
    [t("Categoría"), t("Importe en {moneda}", { moneda }), t("% del total")],
    ...categorias.map((c) => [t(c.nombre), cifra(c.total), Math.round((c.total / suma) * 100)]),
  ];
}

// Cómo quedan las cuentas, debajo de todo. Separado por dos filas, que es otra
// tabla y si no el Excel la junta con la de arriba.
function comoQuedan(pagos, moneda) {
  if (!pagos) return [];
  if (pagos.length === 0) return [[], [], [t("Quién paga a quién")], [t("Nadie debe nada")]];

  return [
    [],
    [],
    [t("Quién paga a quién")],
    [t("Paga"), t("Cobra"), t("Cantidad en {moneda}", { moneda }), t("Estado")],
    ...pagos.map((p) => [p.de, p.a, cifra(p.cantidad), p.saldado ? t("Pagado") : t("Pendiente")]),
  ];
}
