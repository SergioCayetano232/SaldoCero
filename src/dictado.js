// Entender un gasto dicho en voz alta: "cena 45 euros pagó Ana", "pagué yo 12
// con 50 de taxi", "museo 30 entre Ana y Luis". Lo que no se entiende se deja
// como está en el formulario, y el concepto es lo que sobra.

import { normalizar } from "./filtros";
import { hoy, ayer, anteayer } from "./fechas";

const DINERO = new Set(["euro", "euros", "eur", "€", "pavos", "pavo", "dolares", "dolar", "libras", "libra"]);
const CENTIMOS = new Set(["centimos", "centimo", "centavos", "centavo"]);
const PAGAR = new Set(["pago", "pagaste", "pague", "paga", "pagado", "pagao"]);
const YO = new Set(["yo", "pague"]);
// Lo que se cuela alrededor del concepto: "45 de cena" no es "de cena".
const RELLENO = new Set(["de", "del", "la", "el", "los", "las", "en", "para", "por", "un", "una", "y", "al", "lo", "ha", "he", "que", "con"]);

// El reconocedor suele escribir las cifras, pero lo pequeño a veces lo deja en
// letra. Solo vale si va con "euros" detrás, que "dos cafés" no es un importe.
const EN_LETRA = {
  uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, veinte: 20, treinta: 30,
  cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100,
};

function palabras(texto) {
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .map((original) => {
      // "45€" llega pegado: lo separamos en número y moneda.
      const limpio = original.replace(/^[¿¡"(]+|[.,;:!?")]+$/g, "");
      const norma = normalizar(limpio);
      return { original: limpio, norma: norma === "€" ? norma : norma.replace(/€$/, ""), euro: /\d€$/.test(limpio) };
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

    // "pagué", "pagué yo", "yo pagué", "he pagado yo".
    if (YO.has(p[i].norma) || p[i + 1]?.norma === "yo" || p[i - 1]?.norma === "yo" || p[i - 1]?.norma === "he") {
      if (p[i + 1]?.norma === "yo") usadas.push(i + 1);
      if (p[i - 1]?.norma === "yo" || p[i - 1]?.norma === "he") usadas.push(i - 1);
      return { id: soy, usadas };
    }

    // "pagó Ana", "lo ha pagado Ana".
    const despues = viajeroEn(p, i + 1, viajeros);
    if (despues) {
      for (let k = 1; k <= despues.largo; k++) usadas.push(i + k);
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

// "entre Ana y Luis", "entre Ana, Luis y Eva", "entre todos".
function buscarEntre(p, viajeros) {
  const i = p.findIndex((t) => t.norma === "entre");
  if (i < 0) return null;
  if (p[i + 1]?.norma === "todos") return { ids: viajeros.map((v) => v.id), usadas: [i, i + 1] };

  const ids = [];
  const usadas = [i];
  let j = i + 1;
  while (j < p.length) {
    const encontrado = viajeroEn(p, j, viajeros);
    if (encontrado) {
      ids.push(encontrado.viajero.id);
      for (let k = 0; k < encontrado.largo; k++) usadas.push(j + k);
      j += encontrado.largo;
    } else if (p[j].norma === "y" && ids.length > 0) {
      usadas.push(j++);
    } else break;
  }

  return ids.length > 0 ? { ids, usadas } : null;
}

// "cena de ayer", "anoche", "antes de ayer". Lo de más atrás ya no se dice así,
// eso se elige en el calendario.
function buscarDia(p) {
  for (let i = 0; i < p.length; i++) {
    const n = p[i].norma;
    if (n === "antes" && p[i + 1]?.norma === "de" && p[i + 2]?.norma === "ayer") {
      return { fecha: anteayer(), usadas: [i, i + 1, i + 2] };
    }
    if (n === "anteayer") return { fecha: anteayer(), usadas: [i] };
    if (n === "ayer" || n === "anoche") return { fecha: ayer(), usadas: [i] };
    if (n === "hoy") return { fecha: hoy(), usadas: [i] };
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
  const dia = buscarDia(p.map((t, i) => (usadas.has(i) ? { ...t, norma: "" } : t)));
  if (dia) marcar(dia.usadas);

  const resto = p.filter((_, i) => !usadas.has(i) && !DINERO.has(p[i].norma));
  while (resto.length && RELLENO.has(resto[0].norma)) resto.shift();
  while (resto.length && RELLENO.has(resto.at(-1).norma)) resto.pop();

  return {
    importe: importe ? enTexto(importe.valor) : null,
    concepto: resto.map((t) => t.original).join(" "),
    pagadorId: pagador?.id ?? null,
    participantes: entre?.ids ?? null,
    fecha: dia?.fecha ?? null,
  };
}

// El reconocimiento de voz del navegador, si lo tiene. Chrome y Safari lo llevan con prefijo.
export function reconocedorDeVoz(ventana = globalThis) {
  return ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition ?? null;
}
