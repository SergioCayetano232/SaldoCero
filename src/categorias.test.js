import { describe, it, expect } from "vitest";
import { CATEGORIAS, categoriaDe, gastoPorCategoria } from "./categorias";
import { importeDeGasto } from "./calculos";

describe("categoriaDe", () => {
  it("encuentra la que le pides", () => {
    expect(categoriaDe("comida").nombre).toBe("Comida");
  });

  it("si no existe, devuelve otros", () => {
    expect(categoriaDe("submarinismo").id).toBe("otros");
  });

  it("un gasto sin categoría también cae en otros", () => {
    expect(categoriaDe(undefined).id).toBe("otros");
  });

  it("todas tienen emoji, nombre y color", () => {
    for (const c of CATEGORIAS) {
      expect(c.emoji).toBeTruthy();
      expect(c.nombre).toBeTruthy();
      expect(c.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("gastoPorCategoria", () => {
  const gastos = [
    { importe: 240, categoria: "alojamiento" },
    { importe: 60, categoria: "comida" },
    { importe: 26.5, categoria: "comida" },
    { importe: 45, categoria: "transporte" },
  ];

  it("suma lo de cada una", () => {
    const reparto = gastoPorCategoria(gastos, importeDeGasto);
    const comida = reparto.find((c) => c.id === "comida");

    expect(comida.total).toBeCloseTo(86.5);
  });

  it("las ordena de más a menos", () => {
    const reparto = gastoPorCategoria(gastos, importeDeGasto);
    expect(reparto.map((c) => c.id)).toEqual(["alojamiento", "comida", "transporte"]);
  });

  it("no saca las que están a cero", () => {
    const reparto = gastoPorCategoria(gastos, importeDeGasto);
    expect(reparto.find((c) => c.id === "ocio")).toBeUndefined();
  });

  it("los gastos sin categoría van a otros", () => {
    const reparto = gastoPorCategoria([{ importe: 30 }], importeDeGasto);

    expect(reparto).toHaveLength(1);
    expect(reparto[0].id).toBe("otros");
    expect(reparto[0].total).toBe(30);
  });

  it("cuenta el importe convertido, no el original", () => {
    // 60 libras que fueron 70 euros: cuentan los 70.
    const reparto = gastoPorCategoria(
      [{ importe: 60, importeConvertido: 70, categoria: "comida" }],
      importeDeGasto
    );

    expect(reparto[0].total).toBe(70);
  });

  it("sin gastos, lista vacía", () => {
    expect(gastoPorCategoria([], importeDeGasto)).toEqual([]);
  });

  it("lo repartido suma el total", () => {
    const reparto = gastoPorCategoria(gastos, importeDeGasto);
    const suma = reparto.reduce((t, c) => t + c.total, 0);

    expect(suma).toBeCloseTo(371.5);
  });
});
