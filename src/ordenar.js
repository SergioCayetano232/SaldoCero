// En qué orden se ve la lista de gastos. Como los filtros, solo cambia lo que se ve.

import { importeDeGasto } from "./calculos";
import { BOTE } from "./bote";

export const ORDENES = [
  { id: "dias", nombre: "Por días" },
  { id: "importe", nombre: "Más caros" },
  { id: "pagador", nombre: "Por quién pagó" },
];

export const POR_DIAS = "dias";

// Por días no se toca: eso ya lo agrupa la lista.
export function ordenarGastos(gastos, orden, viajeros) {
  const masCaro = (a, b) => importeDeGasto(b) - importeDeGasto(a);

  if (orden === "importe") return [...gastos].sort(masCaro);

  if (orden === "pagador") {
    const nombre = new Map(viajeros.map((v) => [v.id, v.nombre]));
    // El bote y los que ya no están, al final.
    const clave = (g) => (g.pagadorId === BOTE ? "￿" : nombre.get(g.pagadorId) ?? "￿￿");

    return [...gastos].sort((a, b) => clave(a).localeCompare(clave(b), "es") || masCaro(a, b));
  }

  return gastos;
}
