import { describe, it, expect } from "vitest";
import { platoNuevo, repartoPorPlatos, alternarEnPlato } from "./platos";
import { importesAPartes } from "./importes";
import { repartoDeGasto } from "./calculos";

const ids = ["ana", "luis", "eva"];

const suma = (importes) =>
  Math.round(Object.values(importes).reduce((t, x) => t + Number(x), 0) * 100) / 100;

describe("repartoPorPlatos", () => {
  it("cada uno lo suyo y el resto entre todos", () => {
    const platos = [
      { importe: "20", de: ["ana"] },
      { importe: "11", de: ["luis"] },
    ];
    const r = repartoPorPlatos(platos, ids, 40);

    // Sobran 9: 3 para cada uno.
    expect(r.entreTodos).toBe(9);
    expect(r.importes).toEqual({ ana: "23", luis: "14", eva: "3" });
  });

  it("un plato de dos se parte entre esos dos", () => {
    const r = repartoPorPlatos([{ importe: "15", de: ["ana", "eva"] }], ids, 15);
    expect(r.importes).toEqual({ ana: "7.5", luis: "0", eva: "7.5" });
  });

  it("sin nadie marcado, el plato es de todos", () => {
    const r = repartoPorPlatos([{ importe: "30", de: [] }], ids, 30);
    expect(r.importes).toEqual({ ana: "10", luis: "10", eva: "10" });
  });

  it("los marcados que ya no van en el gasto no cuentan", () => {
    const r = repartoPorPlatos([{ importe: "10", de: ["pepe"] }], ["ana", "luis"], 10);
    expect(r.importes).toEqual({ ana: "5", luis: "5" });
  });

  it("vale escribir cuentas en el plato", () => {
    const r = repartoPorPlatos([{ importe: "2×2,5", de: ["luis"] }], ids, 5);
    expect(r.importes.luis).toBe("5");
  });

  it("los céntimos cuadran justo con el total", () => {
    const platos = [
      { importe: "10", de: [] },
      { importe: "10", de: [] },
      { importe: "10", de: [] },
    ];
    const r = repartoPorPlatos(platos, ids, 30.01);
    expect(suma(r.importes)).toBe(30.01);
  });

  it("los céntimos sueltos no le caen siempre al mismo", () => {
    const platos = [
      { importe: "0,01", de: [] },
      { importe: "0,01", de: [] },
      { importe: "0,01", de: [] },
    ];
    const r = repartoPorPlatos(platos, ids, 0.03);
    expect(r.importes).toEqual({ ana: "0.01", luis: "0.01", eva: "0.01" });
  });

  it("si los platos se pasan, no hay importes y dice cuánto sobra", () => {
    const r = repartoPorPlatos([{ importe: "50", de: ["ana"] }], ids, 40);
    expect(r.importes).toBeNull();
    expect(r.entreTodos).toBe(-10);
  });

  it("los platos vacíos o raros no cuentan", () => {
    const r = repartoPorPlatos([platoNuevo(), { importe: "abc", de: ["ana"] }], ids, 9);
    expect(r.importes).toEqual({ ana: "3", luis: "3", eva: "3" });
  });

  it("sin importe o sin nadie, nada", () => {
    expect(repartoPorPlatos([], ids, 0)).toBeNull();
    expect(repartoPorPlatos([], ids, NaN)).toBeNull();
    expect(repartoPorPlatos([], [], 10)).toBeNull();
  });

  it("guardado como importes, las cuentas dan lo mismo", () => {
    const r = repartoPorPlatos([{ importe: "25", de: ["ana"] }], ids, 40);
    const gasto = { importe: 40, partes: importesAPartes(r.importes, ids) };
    const reparto = repartoDeGasto(gasto, ids.map((id) => ({ id })));

    expect(reparto.get("ana")).toBeCloseTo(30);
    expect(reparto.get("luis")).toBeCloseTo(5);
    expect(reparto.get("eva")).toBeCloseTo(5);
  });
});

describe("alternarEnPlato", () => {
  it("pone y quita", () => {
    const uno = alternarEnPlato(platoNuevo(), "ana");
    expect(uno.de).toEqual(["ana"]);
    expect(alternarEnPlato(uno, "ana").de).toEqual([]);
  });
});
