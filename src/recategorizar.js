// Cambiar de categoría todos los gastos que tienes a la vista: buscas "café",
// están en Otros, y los pasas a Comida de una vez.

import { categoriaDe, CATEGORIAS, POR_DEFECTO } from "./categorias";

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
  return cuantos === 2 ? "Pasar los dos a…" : `Pasar los ${cuantos} a…`;
}

export function textoPasados(cuantos, categoria) {
  const nombre = categoriaDe(categoria).nombre;
  return cuantos === 1 ? `Has pasado 1 gasto a ${nombre}` : `Has pasado ${cuantos} gastos a ${nombre}`;
}
