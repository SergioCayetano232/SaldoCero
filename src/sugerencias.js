// Los conceptos que ya se han apuntado en el viaje, para no teclearlos otra vez
// en el móvil. Y de paso, con la categoría que llevaban.

import { normalizar } from "./filtros";
import { POR_DEFECTO, conceptoSinEscribir } from "./categorias";

// Más de tres pastillas debajo del campo ya tapan el formulario.
export const CUANTAS = 3;

// Los que empiezan por lo escrito van antes que los que solo lo contienen; y
// entre esos, el más repetido. La categoría y el importe, los de la última vez.
export function sugerirConceptos(gastos, texto, cuantas = CUANTAS) {
  const buscado = normalizar(texto);
  if (!buscado) return [];

  const vistos = new Map();

  // Vienen de más viejo a más nuevo, así que el último que pasa es el bueno.
  gastos.forEach((gasto, orden) => {
    const clave = normalizar(gasto.concepto);
    // "Gasto" o "Comida" a secas es lo que se pone cuando lo dejas vacío, no lo
    // escribió nadie.
    if (!clave.includes(buscado) || clave === "gasto") return;
    if (clave === normalizar(conceptoSinEscribir(gasto.categoria))) return;

    const antes = vistos.get(clave);
    vistos.set(clave, {
      concepto: gasto.concepto.trim(),
      categoria: gasto.categoria ?? POR_DEFECTO,
      importe: gasto.importe ?? null,
      moneda: gasto.moneda ?? null,
      veces: (antes?.veces ?? 0) + 1,
      orden,
    });
  });

  // Si ya lo has escrito entero, no hace falta sugerírtelo.
  vistos.delete(buscado);

  const empieza = (s) => normalizar(s.concepto).startsWith(buscado);

  return [...vistos.values()]
    .sort((a, b) => empieza(b) - empieza(a) || b.veces - a.veces || b.orden - a.orden)
    .slice(0, cuantas)
    .map(({ concepto, categoria, importe, moneda }) => ({ concepto, categoria, importe, moneda }));
}

// Lo que se pone en el importe al tocar la sugerencia: el de la última vez, con
// coma. Solo si no has escrito nada y vas en la misma moneda, que si no el
// número no significa lo mismo.
export function importeSugerido(sugerencia, escrito, moneda) {
  if (String(escrito ?? "").trim() !== "") return null;
  if (!(sugerencia.importe > 0) || sugerencia.moneda !== moneda) return null;
  return String(Math.round(sugerencia.importe * 100) / 100).replace(".", ",");
}
