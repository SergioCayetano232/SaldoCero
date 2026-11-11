import { describe, it, expect } from "vitest";
import { destinosPosibles, pasarGasto } from "./mover";
import { BOTE } from "./bote";

const deAqui = [
  { id: "a1", nombre: "Ana" },
  { id: "l1", nombre: "Luís" },
  { id: "m1", nombre: "Marta" },
];
const aqui = { deAqui, monedaAqui: "EUR" };

const alli = {
  nombre: "Oporto",
  moneda: "EUR",
  viajeros: [
    { id: "a2", nombre: "ana" },
    { id: "l2", nombre: "Luis" },
    { id: "p2", nombre: "Pedro" },
  ],
};

const cena = {
  id: "g1",
  pagadorId: "a1",
  pagadores: null,
  importe: 60,
  moneda: "EUR",
  importeConvertido: 60,
  concepto: "Cena",
  categoria: "comida",
  fecha: "2026-11-10",
  nota: "con postre",
  lugar: "Lisboa",
  participantes: ["a1", "l1"],
  partes: { a1: 2, l1: 1 },
  duda: "¿Esto qué es?",
};

describe("destinosPosibles", () => {
  it("tus viajes, sin este ni los cerrados", () => {
    const historial = [
      { codigo: "AQUI", nombre: "Lisboa" },
      { codigo: "OTRO", nombre: "Oporto" },
      { codigo: "VIEJO", nombre: "Roma", cerrado: true },
    ];
    expect(destinosPosibles(historial, "AQUI").map((v) => v.codigo)).toEqual(["OTRO"]);
  });
});

describe("pasarGasto", () => {
  it("cambia a la gente por la del otro viaje, buscándola por el nombre", () => {
    const { gasto } = pasarGasto(cena, aqui, alli);
    expect(gasto.pagadorId).toBe("a2");
    expect(gasto.participantes).toEqual(["a2", "l2"]);
    expect(gasto.partes).toEqual({ a2: 2, l2: 1 });
  });

  it("lo demás se queda como estaba, menos la duda", () => {
    const { gasto } = pasarGasto(cena, aqui, alli);
    expect(gasto).toMatchObject({ importe: 60, importeConvertido: 60, concepto: "Cena", nota: "con postre", lugar: "Lisboa", categoria: "comida" });
    expect(gasto.duda).toBeNull();
  });

  it("los que pagaron entre varios también", () => {
    const { gasto } = pasarGasto({ ...cena, pagadores: { a1: 40, l1: 20 } }, aqui, alli);
    expect(gasto.pagadores).toEqual({ a2: 40, l2: 20 });
  });

  it("si falta alguien, no va y dice quién", () => {
    expect(pasarGasto({ ...cena, participantes: ["a1", "m1"] }, aqui, alli).error).toBe("En Oporto no está Marta.");
  });

  it("si falta el que pagó, tampoco", () => {
    expect(pasarGasto({ ...cena, pagadorId: "m1", participantes: ["a1"] }, aqui, alli).error).toContain("Marta");
  });

  it("del bote no se puede", () => {
    expect(pasarGasto({ ...cena, pagadorId: BOTE }, aqui, alli).error).toBeTruthy();
  });

  it("si el otro va en otra moneda y el gasto se pagó en ella, vale con lo que se pagó", () => {
    const enLibras = { ...cena, moneda: "GBP", importe: 50, importeConvertido: 58.4 };
    const { gasto } = pasarGasto(enLibras, aqui, { ...alli, moneda: "GBP" });
    expect(gasto.importeConvertido).toBe(50);
  });

  it("si no, no hay cambio que poner", () => {
    expect(pasarGasto(cena, aqui, { ...alli, moneda: "GBP" }).error).toBe("Oporto va en GBP y este gasto no.");
  });

  it("una categoría propia que el otro no tiene se queda en Otros", () => {
    expect(pasarGasto({ ...cena, categoria: "p-super" }, aqui, alli).gasto.categoria).toBe("otros");
    const conSuper = { ...alli, categorias: [{ id: "p-super" }] };
    expect(pasarGasto({ ...cena, categoria: "p-super" }, aqui, conSuper).gasto.categoria).toBe("p-super");
  });
});
