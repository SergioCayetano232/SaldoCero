// La lista de la compra del viaje: lo que falta, y al comprarlo se apunta
// como gasto de un toque.

import { normalizar } from "./filtros";
import { enLista } from "./nombres";
import { arreglarConcepto, LARGO_CONCEPTO } from "./concepto";
import { adivinarCategoria } from "./adivinar";
import { tn } from "./idioma";

// "Papel de cocina y bolsas de basura" cabe. Más es ya una nota.
export const LARGO_COMPRA = 40;

// "pan, leche y huevos" son tres cosas. Pegado de las notas del móvil, una por
// línea, con guiones o números delante, también.
export function separarCompras(texto) {
  return String(texto ?? "")
    .split(/[,;\n]|\s+y\s+|\s+e\s+/i)
    .map((trozo) => trozo.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/, "").replace(/\s+/g, " ").trim().slice(0, LARGO_COMPRA).trim())
    .filter(Boolean);
}

// Lo que ya está pendiente en la lista no se vuelve a meter: dos "pan" son
// dos personas comprándolo. Lo ya comprado sí, que puede hacer falta otra vez.
export function nuevasCompras(texto, lista = []) {
  const yaEstan = new Set(lista.filter((c) => !c.comprado).map((c) => normalizar(c.texto)));
  const nuevas = [];
  const repetidas = [];

  for (const cosa of separarCompras(texto)) {
    const clave = normalizar(cosa);
    if (yaEstan.has(clave)) repetidas.push(cosa);
    else {
      yaEstan.add(clave);
      nuevas.push(cosa);
    }
  }

  return { nuevas, repetidas };
}

// Primero lo que falta, y lo comprado al final. Dentro, en el orden en que se apuntó.
export function ordenarCompras(lista = []) {
  const porFecha = (a, b) => (a.creadoEn ?? "").localeCompare(b.creadoEn ?? "");
  return [...lista.filter((c) => !c.comprado).sort(porFecha), ...lista.filter((c) => c.comprado).sort(porFecha)];
}

// "Pan, leche y huevos" para el concepto del gasto. Si no cabe en el concepto,
// las primeras y "y 4 cosas más".
export function conceptoDeCompras(cosas) {
  const textos = cosas.map((c) => c.texto);
  for (let caben = textos.length; caben > 0; caben--) {
    const resto = textos.length - caben;
    const partes = resto ? [...textos.slice(0, caben), tn(resto, "{n} cosa más", "{n} cosas más")] : textos;
    const concepto = arreglarConcepto(enLista(partes).toLocaleLowerCase("es-ES"));
    if (enLista(partes).length <= LARGO_CONCEPTO) return concepto;
  }
  return arreglarConcepto(textos[0] ?? "");
}

// Si se adivina por lo que es (helados, gasolina...), esa. Si no, compras.
export function categoriaDeCompras(cosas) {
  return adivinarCategoria(cosas.map((c) => c.texto).join(" ")) ?? "compras";
}
