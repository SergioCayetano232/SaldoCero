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

  it("en inglés también", () => {
    expect(adivinarCategoria("Dinner")).toBe("comida");
    expect(adivinarCategoria("Beers at the pub")).toBe("comida");
    expect(adivinarCategoria("Groceries")).toBe("comida");
    expect(adivinarCategoria("Flights")).toBe("transporte");
    expect(adivinarCategoria("Buses")).toBe("transporte");
    expect(adivinarCategoria("Car rental")).toBe("transporte");
    expect(adivinarCategoria("Hostel")).toBe("alojamiento");
    expect(adivinarCategoria("Museum tickets")).toBe("ocio");
    expect(adivinarCategoria("Gifts")).toBe("compras");
    expect(adivinarCategoria("Clothes")).toBe("compras");
  });

  it("en inglés manda la primera palabra igual que en español", () => {
    expect(adivinarCategoria("Dinner at the hotel")).toBe("comida");
    expect(adivinarCategoria("Taxi to the airport")).toBe("transporte");
  });

  it("no confunde palabras de un idioma con trozos del otro", () => {
    // "car" no es "carne" ni "carta", ni "inn" es "ingles".
    expect(adivinarCategoria("Carne")).toBeNull();
    expect(adivinarCategoria("Inglés")).toBeNull();
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
