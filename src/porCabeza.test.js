import { describe, it, expect } from "vitest";
import { porCabeza } from "./porCabeza";
import { BOTE } from "./bote";

const viajeros = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

describe("porCabeza", () => {
  it("entre todos a partes iguales", () => {
    expect(porCabeza({ pagadorId: "a", importe: 50 }, viajeros)).toBe(12.5);
  });

  it("solo entre los que van", () => {
    const gasto = { pagadorId: "a", importe: 30, participantes: ["a", "b"] };
    expect(porCabeza(gasto, viajeros)).toBe(15);
  });

  it("en la moneda del viaje si se pagó en otra", () => {
    const gasto = { pagadorId: "a", importe: 4000, moneda: "JPY", importeConvertido: 24 };
    expect(porCabeza(gasto, viajeros)).toBe(6);
  });

  it("con partes que son todas iguales, aunque no sean 1", () => {
    const gasto = { pagadorId: "a", importe: 20, participantes: ["a", "b"], partes: { a: 2, b: 2 } };
    expect(porCabeza(gasto, viajeros)).toBe(10);
  });

  it("nada si va a partes distintas", () => {
    const gasto = { pagadorId: "a", importe: 30, participantes: ["a", "b"], partes: { a: 2, b: 1 } };
    expect(porCabeza(gasto, viajeros)).toBeNull();
  });

  it("nada si es de uno solo", () => {
    const gasto = { pagadorId: "a", importe: 30, participantes: ["b"] };
    expect(porCabeza(gasto, viajeros)).toBeNull();
  });

  it("nada si se ha quedado sin nadie", () => {
    const gasto = { pagadorId: "a", importe: 30, participantes: [] };
    expect(porCabeza(gasto, viajeros)).toBeNull();
  });

  it("también los del bote", () => {
    expect(porCabeza({ pagadorId: BOTE, importe: 40 }, viajeros)).toBe(10);
  });
});
