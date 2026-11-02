import { describe, it, expect } from "vitest";
import { aOtraCategoria, categoriasDestino, textoPasarA, textoPasados } from "./recategorizar";

const gasto = (id, categoria) => ({ id, concepto: "Café", importe: 2, categoria });

describe("aOtraCategoria", () => {
  it("cambia la categoría y guarda cómo estaba", () => {
    const g = gasto("1", "otros");
    expect(aOtraCategoria([g], "comida")).toEqual([{ id: "1", antes: g, despues: { ...g, categoria: "comida" } }]);
  });

  it("los que ya están en esa no se tocan", () => {
    const cambios = aOtraCategoria([gasto("1", "comida"), gasto("2", "otros"), gasto("3", "ocio")], "comida");
    expect(cambios.map((c) => c.id)).toEqual(["2", "3"]);
  });

  it("los de antes, sin categoría, cuentan como Otros", () => {
    expect(aOtraCategoria([gasto("1", undefined)], "otros")).toEqual([]);
    expect(aOtraCategoria([gasto("1", undefined)], "comida")).toHaveLength(1);
  });

  it("no toca el gasto de antes", () => {
    const g = gasto("1", "otros");
    aOtraCategoria([g], "comida");
    expect(g.categoria).toBe("otros");
  });
});

describe("categoriasDestino", () => {
  it("si ya están todos en una, esa no sale", () => {
    const ids = categoriasDestino([gasto("1", "comida"), gasto("2", "comida")]).map((c) => c.id);
    expect(ids).not.toContain("comida");
    expect(ids).toContain("otros");
  });

  it("si están mezclados, salen todas", () => {
    expect(categoriasDestino([gasto("1", "comida"), gasto("2", "otros")])).toHaveLength(6);
  });
});

describe("textos", () => {
  it("pasar a", () => {
    expect(textoPasarA(2)).toBe("Pasar los dos a…");
    expect(textoPasarA(7)).toBe("Pasar los 7 a…");
  });

  it("lo que se ha hecho", () => {
    expect(textoPasados(7, "comida")).toBe("Has pasado 7 gastos a Comida");
    expect(textoPasados(1, "ocio")).toBe("Has pasado 1 gasto a Ocio");
  });
});
