// Sacar el total del texto de un ticket. El OCR lo lee todo, con sus fallos:
// aquí se busca la línea del total y, si no hay, lo más alto que no sea el cambio.

import { normalizar } from "./filtros";

// "12,50", "1.234,50", "12.50", "12 ,50". Siempre con céntimos: un número sin
// ellos en un ticket suele ser una cantidad, un CIF o una hora.
const CIFRA = /(\d{1,3}(?:[.\s]\d{3})*|\d+)\s?[.,]\s?(\d{2})(?!\d)/g;

// Lo que dice que esta línea es la buena, y lo que dice que no.
const ES_TOTAL = /\b(total|importe|a pagar|tot\.?)\b/;
const NO_ES_TOTAL = /\b(subtotal|sub total|base|iva|i\.v\.a|cuota|cambio|entregado|efectivo|devolver|descuento|ahorro|propina sugerida|imponible)\b/;
// "TOTAL (IVA INCL.)" sí es el total, aunque lleve IVA.
const IVA_INCLUIDO = /\biva\s*incl(\.|uido)?/g;
// Ni el cambio ni lo que diste en mano: eso es más que el total.
const NUNCA = /\b(cambio|entregado|efectivo|devolver|devolucion)\b/;

// Los fallos típicos del OCR dentro de una cifra: la O por cero, la S por cinco...
function arreglarCifras(linea) {
  return linea
    .replace(/(?<=\d|[.,])[oO]|[oO](?=[.,]?\d)/g, "0")
    .replace(/(?<=\d)[sS](?=[.,]?\d)|(?<=\d[.,])[sS]/g, "5");
}

function cifrasDe(linea) {
  return [...arreglarCifras(linea).matchAll(CIFRA)].map((m) => Number(`${m[1].replace(/[.\s]/g, "")}.${m[2]}`));
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
