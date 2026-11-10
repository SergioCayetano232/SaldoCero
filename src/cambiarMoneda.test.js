import { describe, it, expect } from "vitest";
import { puedeCambiarMoneda, monedaNueva } from "./cambiarMoneda";

const vacio = { moneda: "EUR", cerradoEn: null, gastos: [], aportaciones: [] };

describe("puedeCambiarMoneda", () => {
  it("con el viaje recién creado, sí", () => {
    expect(puedeCambiarMoneda(vacio)).toBe(true);
  });

  it("con un gasto apuntado, no", () => {
    expect(puedeCambiarMoneda({ ...vacio, gastos: [{ id: "g" }] })).toBe(false);
  });

  it("con dinero en el bote, tampoco", () => {
    expect(puedeCambiarMoneda({ ...vacio, aportaciones: [{ id: "b" }] })).toBe(false);
  });

  it("cerrado, no", () => {
    expect(puedeCambiarMoneda({ ...vacio, cerradoEn: "2026-11-01T10:00:00Z" })).toBe(false);
  });

  it("sin listas, como si estuvieran vacías", () => {
    expect(puedeCambiarMoneda({ moneda: "EUR" })).toBe(true);
    expect(puedeCambiarMoneda(null)).toBe(false);
  });
});

describe("monedaNueva", () => {
  it("una de las que hay", () => {
    expect(monedaNueva("USD", "EUR")).toBe("USD");
  });

  it("la misma o una que no existe, null", () => {
    expect(monedaNueva("EUR", "EUR")).toBeNull();
    expect(monedaNueva("XXX", "EUR")).toBeNull();
    expect(monedaNueva("", "EUR")).toBeNull();
  });
});
