// Entender un gasto dicho en voz alta: "cena 45 euros pagó Ana", "pagué yo 12
// con 50 de taxi", "museo 30 entre Ana y Luis". Lo que no se entiende se deja
// como está en el formulario, y el concepto es lo que sobra.
// También en inglés, mezclado con lo nuestro: "dinner 45 paid by Ana" o "I paid 12
// for the taxi". Mejor así que adivinar el idioma de una frase de cuatro palabras.

import { normalizar } from "./filtros";
import { hoy, ayer, anteayer } from "./fechas";

const DINERO = new Set([
  "euro", "euros", "eur", "€", "pavos", "pavo", "dolares", "dolar", "libras", "libra",
  "dollars", "dollar", "bucks", "buck", "pounds", "pound", "quid", "usd", "gbp", "$", "£",
]);
const CENTIMOS = new Set(["centimos", "centimo", "centavos", "centavo", "cents", "cent", "pence"]);
const PAGAR = new Set(["pago", "pagaste", "pague", "paga", "pagado", "pagao", "paid", "pay", "pays", "payed"]);
const YO = new Set(["yo", "pague"]);
// El que habla, delante del pago: "yo pagué", "I paid", "I've paid".
const YO_DELANTE = new Set(["yo", "i", "i've", "ive"]);
// El que habla, detrás de otra cosa: "paid by me", "except me".
const YO_DETRAS = new Set(["yo", "me", "myself"]);
export const MENOS = new Set(["menos", "sin", "excepto", "salvo", "quitando", "except", "without", "but", "minus", "excluding"]);
const TODOS = new Set(["todos", "everyone", "everybody", "all"]);
// Lo que une dos nombres: "Ana y Luis", "Ana and Luis", "sin Ana ni Eva".
export const UNE = new Set(["y", "ni", "and", "or", "nor"]);
// Lo que se cuela alrededor del concepto: "45 de cena" no es "de cena".
const RELLENO = new Set([
  "de", "del", "la", "el", "los", "las", "en", "para", "por", "un", "una", "y", "al", "lo", "ha", "he", "que", "con",
  "the", "a", "an", "for", "at", "of", "on", "to", "and", "with", "by", "in", "has", "have", "had",
]);

// El reconocedor suele escribir las cifras, pero lo pequeño a veces lo deja en
// letra. Solo vale si va con "euros" detrás, que "dos cafés" no es un importe.
const EN_LETRA = {
  uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, veinte: 20, treinta: 30,
  cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

function palabras(texto) {
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .map((original) => {
      // "45€" o "$45" llegan pegados: lo separamos en número y moneda.
      const limpio = original.replace(/^[¿¡"(]+|[.,;:!?")]+$/g, "");
      const norma = normalizar(limpio);
      const conSimbolo = /\d[€$£]$/.test(limpio) || /^[$£]\d/.test(limpio);
      return { original: limpio, norma: DINERO.has(norma) ? norma : norma.replace(/^[$£]|[€$£]$/g, ""), euro: conSimbolo };
    });
}

const esCifra = (norma) => /^\d+([.,]\d{1,2})?$/.test(norma);
const cifra = (norma) => Number(norma.replace(",", "."));

function buscarImporte(p) {
  const candidatos = p
    .map((t, i) => ({ t, i }))
    .filter(({ t, i }) => esCifra(t.norma) || (EN_LETRA[t.norma] && (DINERO.has(p[i + 1]?.norma) || t.euro)));
  if (candidatos.length === 0) return null;

  // Si hay varias cifras, la que lleva "euros" detrás.
  const elegido =
    candidatos.find(({ t, i }) => t.euro || DINERO.has(p[i + 1]?.norma)) ?? candidatos[0];
  const usadas = [elegido.i];
  let valor = esCifra(elegido.t.norma) ? cifra(elegido.t.norma) : EN_LETRA[elegido.t.norma];

  let j = elegido.i + 1;
  if (DINERO.has(p[j]?.norma)) usadas.push(j++);
  // "12 con 50", "12 euros con 5 céntimos". Sin decir céntimos, "12 con 5" es 12,50.
  if (p[j]?.norma === "con" && /^\d{1,2}$/.test(p[j + 1]?.norma ?? "") && Number.isInteger(valor)) {
    const conCentimos = CENTIMOS.has(p[j + 2]?.norma);
    valor += Number(conCentimos ? p[j + 1].norma : p[j + 1].norma.padEnd(2, "0")) / 100;
    usadas.push(j, j + 1);
    if (conCentimos) usadas.push(j + 2);
  }

  return { valor: Math.round(valor * 100) / 100, usadas };
}

// Un viajero que empieza en la palabra i: con su nombre entero o solo el primero,
// si no hay otro que se llame igual.
function viajeroEn(p, i, viajeros) {
  let mejor = null;
  for (const v of viajeros) {
    const suyo = normalizar(v.nombre).split(/\s+/);
    if (suyo.every((n, k) => p[i + k]?.norma === n)) {
      if (!mejor || suyo.length > mejor.largo) mejor = { viajero: v, largo: suyo.length };
    }
  }
  if (mejor) return mejor;

  const porPrimero = viajeros.filter((v) => normalizar(v.nombre).split(/\s+/)[0] === p[i]?.norma);
  return porPrimero.length === 1 ? { viajero: porPrimero[0], largo: 1 } : null;
}

function buscarPagador(p, viajeros, soy) {
  for (let i = 0; i < p.length; i++) {
    if (!PAGAR.has(p[i].norma)) continue;
    const usadas = [i];

    // El "he" solo con "pagado": "he paid" es otro, no tú.
    const hePagado = p[i - 1]?.norma === "he" && ["pagado", "pagao"].includes(p[i].norma);
    // "I have paid": el "have" va en medio.
    const iHave = p[i - 1]?.norma === "have" && p[i - 2]?.norma === "i";
    // "paid by Ana", "paid by me".
    const by = p[i + 1]?.norma === "by" ? 1 : 0;

    // "pagué", "pagué yo", "yo pagué", "he pagado yo", "I paid", "paid by me".
    if (YO.has(p[i].norma) || p[i + 1]?.norma === "yo" || YO_DELANTE.has(p[i - 1]?.norma) || hePagado || iHave || (by && YO_DETRAS.has(p[i + 2]?.norma))) {
      if (p[i + 1]?.norma === "yo") usadas.push(i + 1);
      if (by && YO_DETRAS.has(p[i + 2]?.norma)) usadas.push(i + 1, i + 2);
      if (YO_DELANTE.has(p[i - 1]?.norma) || hePagado) usadas.push(i - 1);
      if (iHave) usadas.push(i - 1, i - 2);
      return { id: soy, usadas };
    }

    // "pagó Ana", "lo ha pagado Ana", "paid by Ana".
    const despues = viajeroEn(p, i + 1 + by, viajeros);
    if (despues) {
      for (let k = 1; k <= despues.largo + by; k++) usadas.push(i + k);
      return { id: despues.viajero.id, usadas };
    }

    // "Ana pagó", "Ana lo pagó". Hacia atrás, probando desde una o dos palabras antes.
    for (const atras of [1, 2, 3]) {
      const desde = i - atras;
      const antes = desde >= 0 ? viajeroEn(p, desde, viajeros) : null;
      const huecos = p.slice(desde + (antes?.largo ?? 0), i).every((t) => RELLENO.has(t.norma));
      if (antes && huecos) {
        for (let k = desde; k < i; k++) usadas.push(k);
        return { id: antes.viajero.id, usadas };
      }
    }
  }
  return null;
}

// "entre Ana y Luis", "entre Ana, Luis y Eva", "entre todos", "split between Ana and Luis".
function buscarEntre(p, viajeros) {
  const i = p.findIndex((t) => ["entre", "between", "among"].includes(t.norma));
  if (i < 0) return null;
  const delante = ["split", "shared", "divided"].includes(p[i - 1]?.norma) ? [i - 1] : [];
  if (TODOS.has(p[i + 1]?.norma)) {
    const usadas = [...delante, i, i + 1];
    // "between all of us".
    if (p[i + 2]?.norma === "of" && p[i + 3]?.norma === "us") usadas.push(i + 2, i + 3);
    return { ids: viajeros.map((v) => v.id), usadas };
  }

  const ids = [];
  const usadas = [...delante, i];
  let j = i + 1;
  while (j < p.length) {
    const encontrado = viajeroEn(p, j, viajeros);
    if (encontrado) {
      ids.push(encontrado.viajero.id);
      for (let k = 0; k < encontrado.largo; k++) usadas.push(j + k);
      j += encontrado.largo;
    } else if ((p[j].norma === "y" || p[j].norma === "and") && ids.length > 0) {
      usadas.push(j++);
    } else break;
  }

  return ids.length > 0 ? { ids, usadas } : null;
}

// "menos Luis", "sin Ana ni Eva", "todos menos yo". El "sin" solo cuenta con un
// nombre detrás, que "agua sin gas" es un concepto.
function buscarMenos(p, viajeros, soy) {
  for (let i = 0; i < p.length; i++) {
    if (!MENOS.has(p[i].norma)) continue;

    const ids = [];
    const usadas = [i];
    // "todos menos Luis": el "todos" sobra, que no es parte del concepto.
    if (TODOS.has(p[i - 1]?.norma)) usadas.push(i - 1);
    let j = i + 1;
    // "excepto a Luis", "except for Luis".
    if (p[j]?.norma === "a" || p[j]?.norma === "for") usadas.push(j++);
    while (j < p.length) {
      const encontrado = viajeroEn(p, j, viajeros);
      // "sin mí" con su tilde: sin ella es "sin mi tarjeta".
      const yo = soy && (YO_DETRAS.has(p[j].norma) || p[j].original.toLowerCase() === "mí");
      if (encontrado) {
        ids.push(encontrado.viajero.id);
        for (let k = 0; k < encontrado.largo; k++) usadas.push(j + k);
        j += encontrado.largo;
      } else if (yo) {
        ids.push(soy);
        usadas.push(j++);
      } else if (UNE.has(p[j].norma) && ids.length > 0) {
        usadas.push(j++);
      } else break;
    }

    if (ids.length > 0) return { ids, usadas };
  }
  return null;
}

// "cena de ayer", "anoche", "antes de ayer". Lo de más atrás ya no se dice así,
// eso se elige en el calendario.
function buscarDia(p) {
  for (let i = 0; i < p.length; i++) {
    const n = p[i].norma;
    if (n === "antes" && p[i + 1]?.norma === "de" && p[i + 2]?.norma === "ayer") {
      return { fecha: anteayer(), usadas: [i, i + 1, i + 2] };
    }
    if (n === "day" && p[i + 1]?.norma === "before" && p[i + 2]?.norma === "yesterday") {
      return { fecha: anteayer(), usadas: [i, i + 1, i + 2] };
    }
    if (n === "last" && p[i + 1]?.norma === "night") return { fecha: ayer(), usadas: [i, i + 1] };
    if (n === "anteayer") return { fecha: anteayer(), usadas: [i] };
    if (n === "ayer" || n === "anoche" || n === "yesterday") return { fecha: ayer(), usadas: [i] };
    if (n === "hoy" || n === "today" || n === "tonight") return { fecha: hoy(), usadas: [i] };
  }
  return null;
}

// Con coma, como se escribe aquí, y sin ceros de más.
const enTexto = (n) => String(n).replace(".", ",");

export function entenderDictado(texto, viajeros, soy = null) {
  const p = palabras(texto ?? "");
  const usadas = new Set();
  const marcar = (lista) => lista.forEach((i) => usadas.add(i));

  const importe = buscarImporte(p);
  if (importe) marcar(importe.usadas);
  // "pagó" no puede ser el importe ni al revés: el pagador se busca en lo que queda.
  const libres = p.map((t, i) => (usadas.has(i) ? { ...t, norma: "" } : t));
  const pagador = buscarPagador(libres, viajeros, soy);
  if (pagador) marcar(pagador.usadas);
  const entre = buscarEntre(
    p.map((t, i) => (usadas.has(i) ? { ...t, norma: "" } : t)),
    viajeros
  );
  if (entre) marcar(entre.usadas);
  const menos = buscarMenos(
    p.map((t, i) => (usadas.has(i) ? { ...t, norma: "" } : t)),
    viajeros,
    soy
  );
  let participantes = entre?.ids ?? null;
  if (menos) {
    const quedan = (participantes ?? viajeros.map((v) => v.id)).filter((id) => !menos.ids.includes(id));
    // Si no queda nadie, algo se entendió mal: mejor no tocar el reparto.
    if (quedan.length > 0) {
      participantes = quedan;
      marcar(menos.usadas);
    }
  }
  const dia = buscarDia(p.map((t, i) => (usadas.has(i) ? { ...t, norma: "" } : t)));
  if (dia) marcar(dia.usadas);

  const resto = p.filter((_, i) => !usadas.has(i) && !DINERO.has(p[i].norma));
  while (resto.length && RELLENO.has(resto[0].norma)) resto.shift();
  while (resto.length && RELLENO.has(resto.at(-1).norma)) resto.pop();

  return {
    importe: importe ? enTexto(importe.valor) : null,
    concepto: resto.map((t) => t.original).join(" "),
    pagadorId: pagador?.id ?? null,
    participantes,
    fecha: dia?.fecha ?? null,
  };
}

// El reconocimiento de voz del navegador, si lo tiene. Chrome y Safari lo llevan con prefijo.
export function reconocedorDeVoz(ventana = globalThis) {
  return ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition ?? null;
}
