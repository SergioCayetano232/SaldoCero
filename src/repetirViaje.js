// Otro viaje con la misma gente: el finde de la cuadrilla, el de cada verano...

// "Ibiza" → "Ibiza 2", "Ibiza 2" → "Ibiza 3". Y si acaba en un año, el siguiente,
// que "Ibiza 2026 2" no lo escribe nadie.
export function nombreDeLaRepeticion(nombre) {
  const limpio = nombre.trim();
  const numero = limpio.match(/^(.*?)\s*(\d+)$/);

  if (numero && numero[1]) {
    const n = Number(numero[2]);
    const esAno = numero[2].length === 4 && n >= 1900 && n < 2200;
    if (esAno || n < 100) return `${numero[1]} ${n + 1}`;
  }

  return `${limpio} 2`;
}

// Quién pasa al nuevo: los mismos, con su Bizum o IBAN, que no habrá cambiado.
export function genteParaRepetir(viajeros) {
  return viajeros.map((v) => ({ nombre: v.nombre, cobro: v.cobro ?? null }));
}

// Tú en el viaje nuevo. Va por nombre, que los ids son otros.
export function quienEresEnElNuevo(soy, viejos, nuevos) {
  const nombre = viejos.find((v) => v.id === soy)?.nombre;
  return nuevos.find((v) => v.nombre === nombre)?.id ?? null;
}
