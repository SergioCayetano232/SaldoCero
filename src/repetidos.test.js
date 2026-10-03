import { describe, it, expect } from "vitest";
import { posiblesRepetidos } from "./repetidos";

const gastos = [
  { id: "1", concepto: "Cena", importe: 45, fecha: "2026-09-10", pagadorId: "b" },
  { id: "2", concepto: "Taxi", importe: 12, fecha: "2026-09-10", pagadorId: "a" },
  { id: "3", concepto: "Cena", importe: 45, fecha: "2026-09-11", pagadorId: "a" },
];

const nuevo = (cambios) => ({ concepto: "Cena", importe: 45, fecha: "2026-09-10", ...cambios });
const ids = (lista) => lista.map((g) => g.id);

describe("posiblesRepetidos", () => {
  it("mismo día y mismo importe, sospechoso", () => {
    expect(ids(posiblesRepetidos(nuevo(), gastos))).toEqual(["1"]);
  });

  it("aunque el concepto sea otro: lo mismo lo llamó distinto", () => {
    expect(ids(posiblesRepetidos(nuevo({ concepto: "Restaurante" }), gastos))).toEqual(["1"]);
  });

  it("otro día, no", () => {
    expect(posiblesRepetidos(nuevo({ fecha: "2026-09-12" }), gastos)).toEqual([]);
  });

  it("otro importe, no", () => {
    expect(posiblesRepetidos(nuevo({ importe: 46 }), gastos)).toEqual([]);
  });

  it("compara en la moneda del viaje", () => {
    const enDolares = nuevo({ importe: 48.6, importeConvertido: 45 });
    expect(ids(posiblesRepetidos(enDolares, gastos))).toEqual(["1"]);
  });

  it("un céntimo arriba o abajo ya es otro importe", () => {
    expect(posiblesRepetidos(nuevo({ importe: 45.01 }), gastos)).toEqual([]);
  });

  it("al editar, no se avisa de sí mismo", () => {
    expect(posiblesRepetidos(nuevo({ id: "1" }), gastos)).toEqual([]);
  });

  it("los de concepto parecido van primero", () => {
    const lista = [
      { id: "x", concepto: "Peaje", importe: 45, fecha: "2026-09-10" },
      { id: "y", concepto: "cena con vino", importe: 45, fecha: "2026-09-10" },
    ];
    expect(ids(posiblesRepetidos(nuevo(), lista))).toEqual(["y", "x"]);
  });
});
