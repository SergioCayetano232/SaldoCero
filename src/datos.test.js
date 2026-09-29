import { describe, it, expect } from "vitest";
import { datosDelGasto } from "./datos";

const gasto = {
  pagadorId: "b",
  importe: 100,
  moneda: "USD",
  importeConvertido: 92.5,
  concepto: "Cena",
  categoria: "comida",
  fecha: "2026-09-29",
  participantes: ["a", "b", "c"],
  partes: { a: 2, b: 1, c: 1 },
};

describe("datosDelGasto", () => {
  it("lleva todo lo del gasto con los nombres que espera la función", () => {
    expect(datosDelGasto(gasto)).toEqual({
      g_pagador: "b",
      g_importe: 100,
      g_moneda: "USD",
      g_convertido: 92.5,
      g_concepto: "Cena",
      g_categoria: "comida",
      g_fecha: "2026-09-29",
      g_participantes: [
        { viajero_id: "a", partes: 2 },
        { viajero_id: "b", partes: 1 },
        { viajero_id: "c", partes: 1 },
      ],
    });
  });

  it("a partes iguales si no hay partes", () => {
    const args = datosDelGasto({ ...gasto, partes: null });
    expect(args.g_participantes.map((p) => p.partes)).toEqual([1, 1, 1]);
  });

  // Solo van los que están en el gasto, aunque queden partes de alguien que ya no.
  it("las partes de alguien que ya no está en el gasto no se mandan", () => {
    const args = datosDelGasto({ ...gasto, participantes: ["a", "b"] });
    expect(args.g_participantes.map((p) => p.viajero_id)).toEqual(["a", "b"]);
  });
});
