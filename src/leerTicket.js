// Sacar el total del texto de un ticket. El OCR lo lee todo, con sus fallos:
// aquí se busca la línea del total y, si no hay, lo más alto que no sea el cambio.

import { normalizar } from "./filtros";

// "12,50", "1.234,50", "12.50", "12 ,50" y, en los de fuera, "1,234.50". Siempre
// con céntimos: un número sin ellos en un ticket suele ser una cantidad, un CIF o una hora.
const CIFRA = /(\d{1,3}(?:[.,\s]\d{3})*|\d+)\s?[.,]\s?(\d{2})(?!\d)/g;

// Lo que dice que esta línea es la buena, y lo que dice que no. Detrás de lo
// nuestro, lo de los tickets en inglés, que fuera es lo que más sale.
const ES_TOTAL = /\b(total|importe|a pagar|tot\.?|amount due|balance due|amount|to pay)\b/;
const NO_ES_TOTAL =
  /\b(subtotal|sub total|base|iva|i\.v\.a|cuota|cambio|entregado|efectivo|devolver|descuento|ahorro|propina sugerida|imponible|sub-total|tax|vat|gst|change|cash|tendered|discount|savings|suggested tip|tip guide)\b/;
// "TOTAL (IVA INCL.)" o "TOTAL INC VAT" sí es el total, aunque lleve el impuesto.
const IVA_INCLUIDO = /\b(iva|vat|tax)\s*incl(\.|uido|uded)?|\binc(l\.?|luding|\.)?\s*(vat|tax)\b/g;
// Ni el cambio ni lo que diste en mano: eso es más que el total.
const NUNCA = /\b(cambio|entregado|efectivo|devolver|devolucion|change|cash|tendered)\b/;

// Los fallos típicos del OCR dentro de una cifra: la O por cero, la S por cinco...
function arreglarCifras(linea) {
  return linea
    .replace(/(?<=\d|[.,])[oO]|[oO](?=[.,]?\d)/g, "0")
    .replace(/(?<=\d)[sS](?=[.,]?\d)|(?<=\d[.,])[sS]/g, "5");
}

function cifrasDe(linea) {
  return [...arreglarCifras(linea).matchAll(CIFRA)].map((m) => Number(`${m[1].replace(/[.,\s]/g, "")}.${m[2]}`));
}

export function totalDelTicket(texto) {
  const lineas = String(texto ?? "")
    .split(/\n+/)
    .map((original) => ({ original, norma: normalizar(original).replace(IVA_INCLUIDO, "") }))
    .filter((l) => l.norma);

  // La última línea de total manda: en muchos tickets va "TOTAL" antes de la propina.
  const totales = lineas.filter((l) => ES_TOTAL.test(l.norma) && !NO_ES_TOTAL.test(l.norma));
  for (const l of totales.reverse()) {
    const cifras = cifrasDe(l.original).filter((c) => c > 0);
    if (cifras.length) return cifras.at(-1);
  }

  const todas = lineas.filter((l) => !NUNCA.test(l.norma)).flatMap((l) => cifrasDe(l.original));
  const max = Math.max(0, ...todas);
  return max > 0 ? max : null;
}

// "03/11/2026", "3-11-26", "03.11.2026" o "2026-11-03". Siempre con año: sin él,
// "12.50" sería el 12 de mayo.
const FECHA = /(?<!\d)(?:(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})|(\d{4})-(\d{2})-(\d{2}))(?!\d)/g;
// Más atrás de esto no es la fecha del ticket, es el OCR leyendo otra cosa.
const DIAS_ATRAS = 365;

function fechaValida(ano, mes, dia) {
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia ? d.toISOString().slice(0, 10) : null;
}

// El día del ticket, en "2026-11-03", o null. Si hay varias, la de la línea que
// dice "fecha"; si no, la primera, que la de abajo suele ser la de caducidad de un vale.
export function fechaDelTicket(texto, hoyEs) {
  const limite = new Date(Date.parse(hoyEs) - DIAS_ATRAS * 86400000).toISOString().slice(0, 10);
  const encontradas = [];

  for (const linea of String(texto ?? "").split(/\n+/)) {
    for (const m of arreglarCifras(linea).matchAll(FECHA)) {
      const fecha = m[4]
        ? fechaValida(Number(m[4]), Number(m[5]), Number(m[6]))
        : fechaValida(Number(m[3].length === 2 ? `20${m[3]}` : m[3]), Number(m[2]), Number(m[1]));
      // Del futuro no puede ser: es otra cosa, o el día y el mes al revés.
      if (fecha && fecha <= hoyEs && fecha >= limite) encontradas.push({ fecha, conNombre: /fecha|date/.test(normalizar(linea)) });
    }
  }

  return (encontradas.find((f) => f.conNombre) ?? encontradas[0])?.fecha ?? null;
}

// Las líneas de lo que se pidió, para la cuenta plato a plato: "2 CAÑAS 5,00".
// Se para en el total, que lo de debajo es el pago, y se salta el IVA y compañía.
const HAY_TOTAL = /\b(total|sub total|importe|a pagar|amount due|balance due|to pay)\b/;
const HORA = /\b\d{1,2}:\d{2}(:\d{2})?\b/g;
// Más de esto no es la cuenta de una mesa, es el OCR leyendo basura.
const MAX_PLATOS = 30;

// "FISH & CHIPS" se queda en "Fish & chips": en mayúsculas grita.
function comoNombre(texto) {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio !== limpio.toUpperCase()) return limpio;
  const bajo = limpio.toLowerCase();
  return bajo.charAt(0).toUpperCase() + bajo.slice(1);
}

export function platosDelTicket(texto) {
  const platos = [];

  for (const original of String(texto ?? "").split(/\n+/)) {
    const norma = normalizar(original);
    if (HAY_TOTAL.test(norma) || NUNCA.test(norma)) break;
    if (NO_ES_TOTAL.test(norma)) continue;

    // La fecha y la hora no son precios, aunque "03.11" lo parezca.
    const sinFechas = arreglarCifras(original).replace(FECHA, " ").replace(HORA, " ");
    const cifras = cifrasDe(sinFechas).filter((c) => c > 0);
    if (!cifras.length) continue;

    // El nombre es lo que queda sin las cifras ni los símbolos de moneda.
    // "2 x 2,50 CAFÉ": el "2 x" va con el precio por unidad, no con el nombre.
    const nombre = comoNombre(
      sinFechas.replace(/\b\d+\s*[x×]\s*(?=\d)/gi, " ").replace(CIFRA, " ").replace(/[€$£]|\beur\b/gi, " ")
    );
    if (!/\p{L}{2,}/u.test(nombre)) continue;

    platos.push({ nombre, importe: cifras.at(-1) });
    if (platos.length === MAX_PLATOS) break;
  }

  return platos;
}

// Con coma, como se escribe aquí, para el campo del importe.
export function totalComoTexto(total) {
  return String(total).replace(".", ",");
}

// El tamaño al que se lee mejor: las letras pequeñas se agrandan, y una foto
// enorme del móvil se encoge, que si no tarda una eternidad.
const LADO_PARA_LEER = 1600;
const ANCHO_MINIMO = 1200;

export function medidaParaLeer(ancho, alto) {
  const escala = Math.min(LADO_PARA_LEER / Math.max(ancho, alto), Math.max(1, ANCHO_MINIMO / ancho));
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
}
