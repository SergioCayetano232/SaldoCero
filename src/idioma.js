// La app en español o en inglés, sin librerías.
// El texto en español es la clave: t("Añadir gasto") da "Add expense" en inglés.
// Lo que aún no esté traducido sale en español, que es mejor que un hueco.

import EN from "./textos/en";

export const IDIOMAS = [
  { id: "es", nombre: "Español", corto: "ES", fechas: "es-ES" },
  { id: "en", nombre: "English", corto: "EN", fechas: "en-GB" },
];

const CLAVE = "saldocero-idioma";
const DICCIONARIOS = { en: EN };

// Las lenguas de aquí leen español sin problema: a esas no les cambiamos nada.
const DE_AQUI = ["es", "ca", "eu", "gl"];

let actual = "es";
const avisar = new Set();

export function idiomaDelMovil(idiomas = []) {
  const primero = String(idiomas[0] ?? "es").toLowerCase();
  return DE_AQUI.some((l) => primero === l || primero.startsWith(`${l}-`)) ? "es" : "en";
}

export function idiomaValido(id) {
  return IDIOMAS.some((i) => i.id === id) ? id : null;
}

export function idiomaGuardado(almacen = globalThis.localStorage) {
  try {
    return idiomaValido(almacen?.getItem(CLAVE));
  } catch {
    return null;
  }
}

export function guardarIdioma(id, almacen = globalThis.localStorage) {
  try {
    almacen?.setItem(CLAVE, id);
  } catch {
    // Sin poder guardarlo, la próxima vez se coge otra vez el del móvil.
  }
}

export function idiomaActual() {
  return actual;
}

export function usarIdioma(id) {
  const nuevo = idiomaValido(id) ?? "es";
  if (nuevo === actual) return;
  actual = nuevo;
  for (const f of avisar) f();
}

// Para que React se repinte al cambiarlo (useSyncExternalStore).
export function alCambiarIdioma(f) {
  avisar.add(f);
  return () => avisar.delete(f);
}

export function otroIdioma(id = actual) {
  return id === "es" ? "en" : "es";
}

// Para toLocaleDateString y compañía.
export function formatoFechas(id = actual) {
  return IDIOMAS.find((i) => i.id === id)?.fechas ?? "es-ES";
}

// "Hola, {nombre}" con { nombre: "Ana" }. Lo que no venga se queda tal cual.
function rellenar(texto, datos) {
  if (!datos) return texto;
  return texto.replace(/\{(\w+)\}/g, (entero, clave) => (clave in datos ? String(datos[clave]) : entero));
}

export function t(texto, datos, id = actual) {
  const traducido = DICCIONARIOS[id]?.[texto] ?? texto;
  return rellenar(traducido, datos);
}

// Con plural: tn(3, "{n} gasto", "{n} gastos").
export function tn(n, uno, varios, datos, id = actual) {
  return t(n === 1 ? uno : varios, { n, ...datos }, id);
}
