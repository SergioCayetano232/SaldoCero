// Poner nombre a un viajero o al viaje.

// Más largo ya no cabe en las filas del resumen.
export const LARGO_MAXIMO = 40;

// "  Javier   López " se queda en "Javier López". Vacío, null.
export function limpiarNombre(texto) {
  const limpio = String(texto ?? "").replace(/\s+/g, " ").trim().slice(0, LARGO_MAXIMO).trim();
  return limpio === "" ? null : limpio;
}

// El nombre nuevo si hay que guardarlo, o null si no hay nada que hacer:
// vacío (no se deja a nadie sin nombre) o igual que el que tenía.
export function nombreNuevo(texto, actual) {
  const limpio = limpiarNombre(texto);
  if (limpio === null || limpio === actual) return null;
  return limpio;
}

// Dos "Luis" no hay quien los distinga en el resumen, y encima salen del mismo
// color. "luis" y "Luís" también cuentan como el mismo. Devuelve el que ya estaba.
// Al renombrar a alguien, él no cuenta: de "luis" a "Luis" se puede.
export function nombreRepetido(nombre, viajeros, salvoId = null) {
  const igualar = (texto) =>
    String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const buscado = igualar(nombre);
  return viajeros.find((v) => v.id !== salvoId && igualar(v.nombre) === buscado)?.nombre ?? null;
}

// En el campo de añadir caben varios, "Ana, Luis, Marta", así que va más largo.
export const LARGO_VARIOS = 200;

// Para meter a todo el grupo de una vez. Los que ya están (o van dos veces)
// se apartan, para dejarlos en el campo y que les pongas la inicial.
export function separarNombres(texto, viajeros) {
  const nuevos = [];
  const repetidos = [];

  for (const trozo of String(texto ?? "").split(",")) {
    const nombre = limpiarNombre(trozo);
    if (!nombre) continue;

    const yaEsta = nombreRepetido(nombre, [...viajeros, ...nuevos.map((n) => ({ nombre: n }))]);
    if (yaEsta) repetidos.push({ nombre, yaEsta });
    else nuevos.push(nombre);
  }

  return { nuevos, repetidos };
}

// "Luis ya está en el viaje", o "Luis y Pedro ya están" si eran varios.
export function avisoDeRepetidos(nombres) {
  const unicos = [...new Set(nombres)];
  if (unicos.length === 0) return null;

  const quienes =
    unicos.length === 1 ? unicos[0] : `${unicos.slice(0, -1).join(", ")} y ${unicos.at(-1)}`;
  const verbo = unicos.length === 1 ? "ya está" : "ya están";
  return `${quienes} ${verbo} en el viaje. Ponle la inicial del apellido para no liaros.`;
}
