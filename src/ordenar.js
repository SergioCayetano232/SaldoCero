// En qué orden se ve la lista de gastos. Como los filtros, solo cambia lo que se ve.

import { importeDeGasto } from "./calculos";
import { BOTE } from "./bote";

export const ORDENES = [
  { id: "dias", nombre: "Por días" },
  { id: "importe", nombre: "Más caros" },
  { id: "pagador", nombre: "Por quién pagó" },
  { id: "recientes", nombre: "Últimos apuntados" },
];

export const POR_DIAS = "dias";

// Por días no se toca: eso ya lo agrupa la lista.
export function ordenarGastos(gastos, orden, viajeros) {
  const masCaro = (a, b) => importeDeGasto(b) - importeDeGasto(a);

  if (orden === "importe") return [...gastos].sort(masCaro);

  // Por cuándo se apuntó, no por el día del gasto: es para ver qué acaba de meter alguien.
  if (orden === "recientes") {
    return [...gastos].sort((a, b) => (b.creadoEn ?? "").localeCompare(a.creadoEn ?? ""));
  }

  if (orden === "pagador") {
    const nombre = new Map(viajeros.map((v) => [v.id, v.nombre]));
    // El bote y los que ya no están, al final.
    const clave = (g) => (g.pagadorId === BOTE ? "￿" : nombre.get(g.pagadorId) ?? "￿￿");

    return [...gastos].sort((a, b) => clave(a).localeCompare(clave(b), "es") || masCaro(a, b));
  }

  return gastos;
}

// Lo que venga guardado de otra vez. Si es un orden que ya no existe, o basura,
// por días, que es lo de siempre.
export function ordenGuardado(guardado) {
  return ORDENES.some((o) => o.id === guardado) ? guardado : POR_DIAS;
}
