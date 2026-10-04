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
export function nombreRepetido(nombre, viajeros) {
  const igualar = (texto) =>
    String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const buscado = igualar(nombre);
  return viajeros.find((v) => igualar(v.nombre) === buscado)?.nombre ?? null;
}
