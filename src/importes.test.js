import { describe, it, expect } from "vitest";
import {
  leerImporte,
  loQueFalta,
  cuadra,
  importesAPartes,
  partesAImportes,
  vanPorImportes,
} from "./importes";
import { repartoDeGasto } from "./calculos";

const ids = ["a", "b", "c"];

describe("leerImporte", () => {
  it("con punto o con coma", () => {
    expect(leerImporte("12.5")).toBe(12.5);
    expect(leerImporte("12,5")).toBe(12.5);
  });

  it("vacío, raro o negativo, cero", () => {
    expect(leerImporte("")).toBe(0);
    expect(leerImporte(undefined)).toBe(0);
    expect(leerImporte("abc")).toBe(0);
    expect(leerImporte("-3")).toBe(0);
  });
});

describe("loQueFalta y cuadra", () => {
  it("12 + 8 de 30, faltan 10", () => {
    expect(loQueFalta({ a: "12", b: "8" }, ["a", "b"], 30)).toBe(10);
    expect(cuadra({ a: "12", b: "8" }, ["a", "b"], 30)).toBe(false);
  });

  it("si se pasa, sale en negativo", () => {
    expect(loQueFalta({ a: "20", b: "15" }, ["a", "b"], 30)).toBe(-5);
  });

  it("los decimales no descuadran", () => {
    const importes = { a: "10.1", b: "10.2", c: "10.3" };
    expect(loQueFalta(importes, ids, 30.6)).toBe(0);
    expect(cuadra(importes, ids, 30.6)).toBe(true);
  });

  it("solo cuentan los marcados", () => {
    expect(cuadra({ a: "20", b: "10", c: "99" }, ["a", "b"], 30)).toBe(true);
  });

  it("sin importe no cuadra nunca", () => {
    expect(cuadra({}, ids, 0)).toBe(false);
  });
});

describe("importesAPartes", () => {
  it("cada importe es su peso, y el que falta va a cero", () => {
    expect(importesAPartes({ a: "12,5", b: "7.5" }, ids)).toEqual({ a: 12.5, b: 7.5, c: 0 });
  });

  it("guardado así, el reparto da justo esas cifras", () => {
    const partes = importesAPartes({ a: "12", b: "8", c: "10" }, ids);
    const gasto = { importe: 30, importeConvertido: 30, partes };
    const reparto = repartoDeGasto(gasto, ids.map((id) => ({ id })));

    expect(reparto.get("a")).toBeCloseTo(12);
    expect(reparto.get("b")).toBeCloseTo(8);
    expect(reparto.get("c")).toBeCloseTo(10);
  });

  it("en otra moneda, el cambio se reparte en la misma proporción", () => {
    // 300 dírhams que fueron 27,75 €: 200 y 100 son dos tercios y un tercio.
    const partes = importesAPartes({ a: "200", b: "100" }, ["a", "b"]);
    const gasto = { importe: 300, importeConvertido: 27.75, partes };
    const reparto = repartoDeGasto(gasto, [{ id: "a" }, { id: "b" }]);

    expect(reparto.get("a")).toBeCloseTo(18.5);
    expect(reparto.get("b")).toBeCloseTo(9.25);
  });
});

describe("partesAImportes", () => {
  it("a partes iguales, y el céntimo que sobra a alguien", () => {
    const importes = partesAImportes({}, ids, 10);
    expect(importes).toEqual({ a: "3.34", b: "3.33", c: "3.33" });
    expect(cuadra(importes, ids, 10)).toBe(true);
  });

  it("con 2 y 1, dos tercios y un tercio", () => {
    expect(partesAImportes({ a: 2, b: 1 }, ["a", "b"], 30)).toEqual({ a: "20", b: "10" });
  });

  it("cuadra siempre, con importes feos", () => {
    const importes = partesAImportes({ a: 1.5, b: 1, c: 0.5 }, ids, 47.99);
    expect(cuadra(importes, ids, 47.99)).toBe(true);
  });

  it("sin importe todavía, vacío", () => {
    expect(partesAImportes({ a: 2 }, ids, 0)).toEqual({});
    expect(partesAImportes({ a: 2 }, ids, NaN)).toEqual({});
  });

  it("si las partes son todas cero, vacío", () => {
    expect(partesAImportes({ a: 0, b: 0 }, ["a", "b"], 10)).toEqual({});
  });
});

describe("vanPorImportes", () => {
  it("si suman el importe, iban por importes", () => {
    expect(vanPorImportes({ a: 12, b: 8, c: 10 }, 30)).toBe(true);
  });

  it("partes de verdad, no", () => {
    expect(vanPorImportes({ a: 2, b: 1 }, 30)).toBe(false);
  });

  it("a partes iguales tampoco, aunque sumen el importe", () => {
    expect(vanPorImportes({ a: 1, b: 1 }, 2)).toBe(false);
  });

  it("los de antes, sin partes, no", () => {
    expect(vanPorImportes(undefined, 30)).toBe(false);
    expect(vanPorImportes({}, 30)).toBe(false);
  });

  it("con alguno a cero también vale", () => {
    expect(vanPorImportes({ a: 30, b: 0 }, 30)).toBe(true);
  });
});
