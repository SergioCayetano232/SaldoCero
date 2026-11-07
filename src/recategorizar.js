// Cambiar de categoría todos los gastos que tienes a la vista: buscas "café",
// están en Otros, y los pasas a Comida de una vez.

import { categoriaDe, CATEGORIAS, POR_DEFECTO } from "./categorias";
import { t } from "./idioma";

// Solo los que cambian de verdad. Los que ya estaban en esa ni se tocan.
export function aOtraCategoria(gastos, categoria) {
  return gastos
    .filter((g) => (g.categoria ?? POR_DEFECTO) !== categoria)
    .map((g) => ({ id: g.id, antes: g, despues: { ...g, categoria } }));
}

// Las categorías a las que se puede pasar algo. Si ya están todos en Comida,
// Comida no sale.
export function categoriasDestino(gastos) {
  return CATEGORIAS.filter((c) => aOtraCategoria(gastos, c.id).length > 0);
}

export function textoPasarA(cuantos) {
  return cuantos === 2 ? t("Pasar los dos a…") : t("Pasar los {n} a…", { n: cuantos });
}

export function textoPasados(cuantos, categoria) {
  const nombre = t(categoriaDe(categoria).nombre);
  return cuantos === 1 ? t("Has pasado 1 gasto a {nombre}", { nombre }) : t("Has pasado {n} gastos a {nombre}", { n: cuantos, nombre });
}
