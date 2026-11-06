// Pegar de golpe lo que fuisteis apuntando en las notas del móvil:
// "cena 45 ana", "taxi 12,50 luis"... Cada línea, un gasto. Se lee igual que el dictado.

import { entenderDictado, MENOS } from "./dictado";
import { leerImporte } from "./monedas";
import { adivinarCategoria } from "./adivinar";
import { POR_DEFECTO, conceptoSinEscribir } from "./categorias";
import { arreglarConcepto } from "./concepto";
import { hoy } from "./fechas";
import { normalizar } from "./filtros";
import { presentesEseDia } from "./estancia";

// Las notas traen guiones, puntos o números delante: "- cena 45", "2) taxi 12".
function limpiarLinea(linea) {
  return linea.replace(/^\s*(?:[-•*–]|\d+[.)])\s*/, "").trim();
}

function lineas(texto) {
  return String(texto ?? "").split(/\r?\n/).map(limpiarLinea).filter(Boolean);
}

// "menos Ana y Luis" al final: esos nombres son los que no van, no el que pagó.
function vaDetrasDeMenos(palabras, largo, viajeros) {
  const nombres = new Set(viajeros.flatMap((v) => normalizar(v.nombre).split(/\s+/)));
  for (let i = palabras.length - largo - 1; i >= 0; i--) {
    const p = normalizar(palabras[i].replace(/[:,.]+$/, ""));
    if (MENOS.has(p)) return true;
    if (!nombres.has(p) && !["y", "ni", "a"].includes(p)) return false;
  }
  return false;
}

// En las notas nadie escribe "pagó Ana": va el nombre a secas, al final o al
// principio. "cena 45 ana" o "ana: cena 45". Los más largos primero, que
// "Ana María" no se quede en "Ana".
function nombreSuelto(linea, viajeros) {
  const palabras = linea.split(/\s+/);
  // "cena 45 ana menos luis": Luis es el que no va, el que pagó va antes del "menos".
  const corte = palabras.findIndex((p, i) => i > 0 && MENOS.has(normalizar(p)));
  if (corte > 0) {
    const antes = nombreSuelto(palabras.slice(0, corte).join(" "), viajeros);
    if (antes) return { id: antes.id, resto: [antes.resto, ...palabras.slice(corte)].join(" ") };
  }

  const porLargo = [...viajeros].sort((a, b) => b.nombre.length - a.nombre.length);

  for (const v of porLargo) {
    const largo = v.nombre.split(/\s+/).length;
    const buscado = normalizar(v.nombre);
    const quitar = (trozo) => normalizar(trozo.join(" ").replace(/[:,.]+$/, ""));

    if (palabras.length > largo && quitar(palabras.slice(-largo)) === buscado && !vaDetrasDeMenos(palabras, largo, viajeros)) {
      return { id: v.id, resto: palabras.slice(0, -largo).join(" ") };
    }
    if (palabras.length > largo && quitar(palabras.slice(0, largo)) === buscado) {
      return { id: v.id, resto: palabras.slice(largo).join(" ") };
    }
  }
  return null;
}

// Una línea sola se pega como siempre, en el campo.
export function esUnaLista(texto) {
  return lineas(texto).length > 1;
}

// Sin pagador en la línea va el que tengas puesto en el formulario. Y si
// tampoco hay, esa línea no se puede apuntar.
export function gastosDeLista(texto, viajeros, { pagadorId = "", moneda = "EUR", soy = null, dia = hoy() } = {}) {
  const gastos = [];
  const sinEntender = [];

  for (const linea of lineas(texto)) {
    let dicho = entenderDictado(linea, viajeros, soy);
    let pagador = dicho.pagadorId;
    if (!pagador) {
      const suelto = nombreSuelto(linea, viajeros);
      if (suelto) {
        dicho = entenderDictado(suelto.resto, viajeros, soy);
        pagador = suelto.id;
      }
    }
    pagador ??= pagadorId;
    const importe = leerImporte(dicho.importe);

    if (!importe || !pagador) {
      sinEntender.push(linea);
      continue;
    }

    const categoria = adivinarCategoria(dicho.concepto) ?? POR_DEFECTO;
    gastos.push({
      pagadorId: pagador,
      importe,
      moneda,
      importeConvertido: importe,
      concepto: dicho.concepto.trim() ? arreglarConcepto(dicho.concepto) : conceptoSinEscribir(categoria),
      categoria,
      fecha: dicho.fecha ?? dia,
      nota: null,
      participantes: dicho.participantes ?? presentesEseDia(viajeros, dicho.fecha ?? dia),
      partes: null,
    });
  }

  return { gastos, sinEntender };
}

export function textoApuntarLista(cuantos) {
  return cuantos === 1 ? "Apuntar 1 gasto" : `Apuntar los ${cuantos} gastos`;
}
