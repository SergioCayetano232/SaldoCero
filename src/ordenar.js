// En qué orden se ve la lista de gastos. Como los filtros, solo cambia lo que se ve.

import { importeDeGasto, parteDe } from "./calculos";
import { BOTE } from "./bote";
import { CATEGORIAS, categoriaDe } from "./categorias";

export const ORDENES = [
  { id: "dias", nombre: "Por días" },
  { id: "importe", nombre: "Más caros" },
  { id: "baratos", nombre: "Más baratos" },
  { id: "pagador", nombre: "Por quién pagó" },
  { id: "categoria", nombre: "Por categoría" },
  { id: "concepto", nombre: "Por concepto (A-Z)" },
  { id: "recientes", nombre: "Últimos apuntados" },
  { id: "antiguos", nombre: "Primeros apuntados" },
  { id: "mio", nombre: "Lo que más me toca", conYo: true },
];

// "Lo que más me toca" solo tiene sentido si has dicho quién eres.
export function ordenesPara(hayYo) {
  return ORDENES.filter((o) => hayYo || !o.conYo);
}

export const POR_DIAS = "dias";

// El que va detrás en el desplegable, y del último se vuelve al primero.
export function siguienteOrden(actual, hayYo) {
  const ordenes = ordenesPara(hayYo);
  const donde = ordenes.findIndex((o) => o.id === actual);
  return ordenes[(donde + 1) % ordenes.length].id;
}

// Por días no se toca: eso ya lo agrupa la lista.
export function ordenarGastos(gastos, orden, viajeros, soy = null) {
  const masCaro = (a, b) => importeDeGasto(b) - importeDeGasto(a);

  if (orden === "importe") return [...gastos].sort(masCaro);
  // Para cazar los pequeños, o el de 12 € que se apuntó como 1,20.
  if (orden === "baratos") return [...gastos].sort((a, b) => masCaro(b, a));

  // Por cuándo se apuntó, no por el día del gasto: es para ver qué acaba de meter alguien.
  if (orden === "recientes") {
    return [...gastos].sort((a, b) => (b.creadoEn ?? "").localeCompare(a.creadoEn ?? ""));
  }

  // Al revés: el viaje tal y como se fue apuntando. Los que no traen la hora son
  // de antes de guardarla, así que van los primeros.
  if (orden === "antiguos") {
    return [...gastos].sort((a, b) => (a.creadoEn ?? "").localeCompare(b.creadoEn ?? ""));
  }

  if (orden === "pagador") {
    const nombre = new Map(viajeros.map((v) => [v.id, v.nombre]));
    // El bote y los que ya no están, al final.
    const clave = (g) => (g.pagadorId === BOTE ? "￿" : nombre.get(g.pagadorId) ?? "￿￿");

    return [...gastos].sort((a, b) => clave(a).localeCompare(clave(b), "es") || masCaro(a, b));
  }

  // Con numeric, "Menú 2" va antes que "Menú 10". Los que se llaman igual, el más caro arriba.
  if (orden === "concepto") {
    const porNombre = (a, b) => (a.concepto ?? "").localeCompare(b.concepto ?? "", "es", { sensitivity: "base", numeric: true });
    return [...gastos].sort((a, b) => porNombre(a, b) || masCaro(a, b));
  }

  // En el orden en que salen al apuntar, que "Otros" ya va el último.
  if (orden === "categoria") {
    const puesto = (g) => CATEGORIAS.indexOf(categoriaDe(g.categoria));
    return [...gastos].sort((a, b) => puesto(a) - puesto(b) || masCaro(a, b));
  }

  // Lo que me cuesta a mí, no lo que costó: la cena de 90 € entre seis pesa menos
  // que el taxi de 30 entre dos. Los que no van conmigo, al final.
  if (orden === "mio" && soy) {
    const mio = (g) => parteDe(g, soy, viajeros);
    return [...gastos].sort((a, b) => mio(b) - mio(a) || masCaro(a, b));
  }

  return gastos;
}

// Lo que venga guardado de otra vez. Si es un orden que ya no existe, o basura,
// por días, que es lo de siempre.
export function ordenGuardado(guardado) {
  return ORDENES.some((o) => o.id === guardado) ? guardado : POR_DIAS;
}
