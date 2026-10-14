import { describe, it, expect } from "vitest";
import { sugerirConceptos, importeSugerido } from "./sugerencias";

// De más viejo a más nuevo, como llegan de la base de datos.
const gastos = [
  { concepto: "Cena en la plaza", categoria: "comida" },
  { concepto: "Gasolina", categoria: "transporte" },
  { concepto: "Café", categoria: "comida" },
  { concepto: "Gasolina", categoria: "transporte" },
  { concepto: "Escena de teatro", categoria: "ocio" },
  { concepto: "café", categoria: "otros" },
  { concepto: "Gasto" },
];

const conceptos = (lista) => lista.map((s) => s.concepto);

describe("sugerirConceptos", () => {
  it("sin nada escrito no sugiere nada", () => {
    expect(sugerirConceptos(gastos, "")).toEqual([]);
    expect(sugerirConceptos(gastos, "   ")).toEqual([]);
  });

  it("los que empiezan por lo escrito, primero", () => {
    expect(conceptos(sugerirConceptos(gastos, "cen"))).toEqual(["Cena en la plaza", "Escena de teatro"]);
  });

  it("da igual tildes y mayúsculas", () => {
    expect(conceptos(sugerirConceptos(gastos, "CAF"))).toEqual(["café"]);
  });

  it("cada concepto sale una vez, con la categoría de la última", () => {
    expect(sugerirConceptos(gastos, "caf")).toEqual([
      { concepto: "café", categoria: "otros", importe: null, moneda: null },
    ]);
  });

  it("el más repetido va antes", () => {
    const lista = [
      { concepto: "Gastos de peaje", categoria: "transporte" },
      ...gastos,
    ];
    expect(conceptos(sugerirConceptos(lista, "gas"))).toEqual(["Gasolina", "Gastos de peaje"]);
  });

  it("no sugiere el 'Gasto' de cuando se deja vacío", () => {
    expect(conceptos(sugerirConceptos(gastos, "gast"))).toEqual([]);
  });

  it("ni el nombre de la categoría que se pone solo", () => {
    const lista = [
      { concepto: "Comida", categoria: "comida" },
      { concepto: "Comida china", categoria: "comida" },
    ];
    expect(conceptos(sugerirConceptos(lista, "com"))).toEqual(["Comida china"]);
  });

  it("si ya está escrito entero, no lo repite", () => {
    expect(sugerirConceptos(gastos, "gasolina ")).toEqual([]);
  });

  it("como mucho las que se pidan", () => {
    const muchos = ["Taxi 1", "Taxi 2", "Taxi 3", "Taxi 4"].map((concepto) => ({ concepto }));
    expect(sugerirConceptos(muchos, "taxi")).toHaveLength(3);
    expect(sugerirConceptos(muchos, "taxi", 2)).toHaveLength(2);
  });

  it("los de antes sin categoría van a otros", () => {
    expect(sugerirConceptos([{ concepto: "Peaje" }], "pea")).toEqual([
      { concepto: "Peaje", categoria: "otros", importe: null, moneda: null },
    ]);
  });

  it("trae el importe y la moneda de la última vez", () => {
    const lista = [
      { concepto: "Café", importe: 1.2, moneda: "EUR" },
      { concepto: "Café", importe: 1.5, moneda: "EUR" },
    ];
    const [cafe] = sugerirConceptos(lista, "caf");
    expect(cafe.importe).toBe(1.5);
    expect(cafe.moneda).toBe("EUR");
  });
});

describe("importeSugerido", () => {
  const cafe = { concepto: "Café", importe: 1.5, moneda: "EUR" };

  it("con el campo vacío, el de la última vez y con coma", () => {
    expect(importeSugerido(cafe, "", "EUR")).toBe("1,5");
    expect(importeSugerido(cafe, "  ", "EUR")).toBe("1,5");
    expect(importeSugerido({ ...cafe, importe: 20 }, "", "EUR")).toBe("20");
  });

  it("si ya has escrito algo, no lo pisa", () => {
    expect(importeSugerido(cafe, "2", "EUR")).toBeNull();
  });

  it("en otra moneda no vale", () => {
    expect(importeSugerido(cafe, "", "USD")).toBeNull();
  });

  it("sin importe guardado, nada", () => {
    expect(importeSugerido({ concepto: "Peaje", importe: null, moneda: null }, "", "EUR")).toBeNull();
  });
});
