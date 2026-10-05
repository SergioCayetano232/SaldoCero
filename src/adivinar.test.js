import { describe, it, expect } from "vitest";
import { adivinarCategoria } from "./adivinar";
import { CATEGORIAS } from "./categorias";

describe("adivinarCategoria", () => {
  it("reconoce lo de siempre", () => {
    expect(adivinarCategoria("Taxi")).toBe("transporte");
    expect(adivinarCategoria("Cena")).toBe("comida");
    expect(adivinarCategoria("Hotel")).toBe("alojamiento");
    expect(adivinarCategoria("Entradas museo")).toBe("ocio");
    expect(adivinarCategoria("Regalo para mamá")).toBe("compras");
  });

  it("da igual tildes y mayúsculas", () => {
    expect(adivinarCategoria("AUTOBÚS")).toBe("transporte");
    expect(adivinarCategoria("Excursión")).toBe("ocio");
    expect(adivinarCategoria("Cabaña")).toBe("alojamiento");
  });

  it("en plural también", () => {
    expect(adivinarCategoria("Cafés")).toBe("comida");
    expect(adivinarCategoria("Taxis")).toBe("transporte");
    expect(adivinarCategoria("Hoteles")).toBe("alojamiento");
    expect(adivinarCategoria("Dos pensiones")).toBe("alojamiento");
    expect(adivinarCategoria("Cenas")).toBe("comida");
  });

  it("manda la primera palabra que reconoce", () => {
    expect(adivinarCategoria("Cena en el hotel")).toBe("comida");
    expect(adivinarCategoria("Taxi al restaurante")).toBe("transporte");
  });

  it("busca palabras enteras, no trozos", () => {
    // "bar" no es "barbacoa" ni "barato".
    expect(adivinarCategoria("Barbacoa")).toBeNull();
    expect(adivinarCategoria("Escena")).toBeNull();
  });

  it("la puntuación no estorba", () => {
    expect(adivinarCategoria("Gasolina, peaje")).toBe("transporte");
    expect(adivinarCategoria("(cervezas)")).toBe("comida");
  });

  it("si no sabe, null", () => {
    expect(adivinarCategoria("Lo de Luis")).toBeNull();
    expect(adivinarCategoria("")).toBeNull();
    expect(adivinarCategoria(undefined)).toBeNull();
  });

  it("solo devuelve categorías que existen", () => {
    const ids = CATEGORIAS.map((c) => c.id);
    for (const concepto of ["cena", "taxi", "hotel", "museo", "ropa"]) {
      expect(ids).toContain(adivinarCategoria(concepto));
    }
  });
});
