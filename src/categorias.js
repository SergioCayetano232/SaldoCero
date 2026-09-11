// En qué se va el dinero de un viaje.

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

export function categoriaDe(id) {
  return CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS.find((c) => c.id === POR_DEFECTO);
}

// Cuánto se ha ido en cada cosa, de más a menos.
// Solo salen las que tienen algo: una lista con seis ceros no dice nada.
export function gastoPorCategoria(gastos, importeDeGasto) {
  const suma = new Map();

  for (const gasto of gastos) {
    const id = gasto.categoria ?? POR_DEFECTO;
    suma.set(id, (suma.get(id) ?? 0) + importeDeGasto(gasto));
  }

  return [...suma]
    .map(([id, total]) => ({ ...categoriaDe(id), total }))
    .sort((a, b) => b.total - a.total);
}
