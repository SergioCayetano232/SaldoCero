// Casi todo lo apunta quien lo pagó, así que el formulario empieza contigo.
// Si no has dicho quién eres, o ya no estás en el viaje, en blanco como antes.
export function pagadorPorDefecto(soy, viajeros) {
  return soy && viajeros.some((v) => v.id === soy) ? soy : "";
}
