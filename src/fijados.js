// Los gastos fijados arriba de la lista: el alojamiento, el coche... lo que
// se consulta todo el rato. Solo en este móvil.

export function cambiarFijado(ids, id) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

// En el orden en que los fijaste. Los que ya no están (borrados, o pasados a
// otro viaje) se saltan, sin más.
export function gastosFijados(gastos, ids) {
  const porId = new Map(gastos.map((g) => [g.id, g]));
  return ids.map((id) => porId.get(id)).filter(Boolean);
}

// Lo guardado puede venir de cualquier sitio: solo valen listas de textos.
export function fijadosGuardados(valor) {
  return Array.isArray(valor) ? valor.filter((id) => typeof id === "string") : [];
}
