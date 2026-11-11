// En qué se va el dinero de un viaje.

import { t } from "./idioma";

// Pocas y claras, que elegir sea un vistazo y no una lista interminable.
export const CATEGORIAS = [
  { id: "comida", emoji: "🍽️", nombre: "Comida", color: "#e8862e" },
  { id: "transporte", emoji: "🚌", nombre: "Transporte", color: "#0e7c7b" },
  { id: "alojamiento", emoji: "🛏️", nombre: "Alojamiento", color: "#7c5cc4" },
  { id: "ocio", emoji: "🎟️", nombre: "Ocio", color: "#c4457a" },
  { id: "compras", emoji: "🛍️", nombre: "Compras", color: "#2a8f5f" },
  { id: "otros", emoji: "📦", nombre: "Otros", color: "#7b929b" },
];

// La que no se ha elegido, y la de los gastos de antes de que esto existiera.
export const POR_DEFECTO = "otros";

// Las que se inventa cada viaje: "Super", "Peajes"... Van aparte de las de
// siempre y se apuntan al abrir el viaje, como el idioma, para no tener que
// pasar la lista a cada sitio que pinta una categoría.
export const MAXIMO_PROPIAS = 6;
const LARGO_NOMBRE = 16;
const EMOJI_SIN_ELEGIR = "🏷️";
// Ninguno se parece a los de las de siempre, para que en el donut no se confundan.
const COLORES_PROPIAS = ["#3d7dd8", "#d1495b", "#b07d1a", "#6b8e23", "#a0522d", "#5b6ee1"];

let propias = [];

// Lo que llega de la base de datos puede venir de cualquier manera. Lo raro se tira.
export function limpiarPropias(crudo) {
  if (!Array.isArray(crudo)) return [];
  return crudo
    .filter((c) => typeof c?.id === "string" && c.id.startsWith("p-") && typeof c.nombre === "string" && c.nombre.trim())
    .slice(0, MAXIMO_PROPIAS)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre.trim().slice(0, LARGO_NOMBRE),
      emoji: typeof c.emoji === "string" && c.emoji ? c.emoji : EMOJI_SIN_ELEGIR,
      color: /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : COLORES_PROPIAS[0],
      propia: true,
    }));
}

export function usarCategoriasPropias(lista) {
  propias = limpiarPropias(lista);
}

export function categoriasPropias() {
  return propias;
}

// Las de siempre, luego las del viaje, y "Otros" al final, que es el cajón.
export function todasLasCategorias(lista = propias) {
  const sinOtros = CATEGORIAS.filter((c) => c.id !== POR_DEFECTO);
  return [...sinOtros, ...lista, categoriaDe(POR_DEFECTO, [])];
}

// Si la categoría de un gasto ya no está (la quitaron), cuenta como "Otros".
export function categoriaDe(id, lista = propias) {
  return (
    CATEGORIAS.find((c) => c.id === id) ??
    lista.find((c) => c.id === id) ??
    CATEGORIAS.find((c) => c.id === POR_DEFECTO)
  );
}

function sinAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Solo el primer emoji. Si lo primero es una letra, es que no han puesto ninguno.
function primerEmoji(texto) {
  const trozo = [...new Intl.Segmenter().segment(String(texto ?? "").trim())][0]?.segment;
  if (!trozo || /[\p{L}\p{N}\s]/u.test(trozo)) return EMOJI_SIN_ELEGIR;
  return trozo;
}

// { lista } con la nueva al final, o { error } si no se puede.
export function nuevaCategoria(lista, nombre, emoji) {
  const limpio = String(nombre ?? "").trim().replace(/\s+/g, " ");
  if (!limpio) return { error: t("Ponle un nombre.") };
  if (limpio.length > LARGO_NOMBRE) return { error: t("Como mucho {n} letras.", { n: LARGO_NOMBRE }) };
  if (lista.length >= MAXIMO_PROPIAS) return { error: t("Ya tenéis {n} propias, quitad alguna antes.", { n: MAXIMO_PROPIAS }) };

  const clave = sinAcentos(limpio);
  const repetida = [...CATEGORIAS, ...lista].find((c) => sinAcentos(c.nombre) === clave || sinAcentos(t(c.nombre)) === clave);
  if (repetida) return { error: t("Ya hay una que se llama {nombre}.", { nombre: t(repetida.nombre) }) };

  // El id sale del nombre: si la quitan y la vuelven a poner, sus gastos vuelven con ella.
  const id = `p-${clave.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x"}`;
  const ocupado = (i) => lista.some((c) => c.id === i);
  let libre = id;
  for (let n = 2; ocupado(libre); n++) libre = `${id}-${n}`;

  const color = COLORES_PROPIAS.find((col) => !lista.some((c) => c.color === col)) ?? COLORES_PROPIAS[0];
  const nueva = { id: libre, nombre: limpio, emoji: primerEmoji(emoji), color };
  return { lista: limpiarPropias([...lista, nueva]) };
}

// Mientras tenga gastos no se quita: se irían a "Otros" sin que nadie lo vea.
export function sePuedeQuitar(id, gastos) {
  return !gastos.some((g) => g.categoria === id);
}

export function sinCategoria(lista, id) {
  return lista.filter((c) => c.id !== id);
}

// Para guardarla en la base de datos, sin lo que se calcula.
export function paraGuardar(lista) {
  return lista.map(({ id, nombre, emoji, color }) => ({ id, nombre, emoji, color }));
}

// El concepto de un gasto que dejas en blanco. "Comida" dice algo; "Otros", no,
// así que esos se quedan en "Gasto" como siempre.
export function conceptoSinEscribir(categoria) {
  const c = categoriaDe(categoria);
  return c.id === POR_DEFECTO ? t("Gasto") : t(c.nombre);
}

// Cuánto se ha ido en cada cosa, de más a menos.
// Solo salen las que tienen algo: una lista con seis ceros no dice nada.
export function gastoPorCategoria(gastos, importeDeGasto) {
  const suma = new Map();

  for (const gasto of gastos) {
    const id = gasto.categoria ?? POR_DEFECTO;
    suma.set(id, (suma.get(id) ?? 0) + importeDeGasto(gasto));
  }

  // Con el reparto de uno solo salen ceros: los gastos en los que no iba.
  return [...suma]
    .filter(([, total]) => total > 0)
    .map(([id, total]) => ({ ...categoriaDe(id), total }))
    .sort((a, b) => b.total - a.total);
}
