// El circulito con la inicial de cada viajero.

// Oscuros a propósito: la letra va en blanco y tiene que leerse en claro y en oscuro.
export const COLORES_AVATAR = [
  "#0e7c7b",
  "#c2601a",
  "#7c5cc4",
  "#c4457a",
  "#2a8f5f",
  "#3569b0",
  "#9a7219",
  "#5b6f7a",
];

// La primera letra de verdad. Array.from para no partir un emoji por la mitad.
export function inicial(nombre) {
  const limpio = (nombre ?? "").trim();
  if (limpio === "") return "?";

  return Array.from(limpio)[0].toLocaleUpperCase("es-ES");
}

// Siempre el mismo número para el mismo nombre, sin importar mayúsculas.
function huella(nombre) {
  let h = 0;
  for (const letra of nombre.trim().toLowerCase()) {
    h = (h * 31 + letra.codePointAt(0)) >>> 0;
  }
  return h;
}

// El color de cada viajero, por nombre.
// Va por nombre y no por orden para que no cambien todos al quitar a uno. Si
// dos chocan, el segundo coge el siguiente libre: en un viaje no se repiten.
export function coloresDelViaje(nombres) {
  const colores = new Map();
  const usados = new Set();

  for (const nombre of nombres) {
    if (colores.has(nombre)) continue;

    let i = huella(nombre) % COLORES_AVATAR.length;
    // Si ya están todos cogidos, se repite y ya está.
    for (let intento = 0; intento < COLORES_AVATAR.length && usados.has(i); intento++) {
      i = (i + 1) % COLORES_AVATAR.length;
    }

    colores.set(nombre, COLORES_AVATAR[i]);
    usados.add(i);
  }

  return colores;
}
