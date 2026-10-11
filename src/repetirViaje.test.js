import { describe, it, expect } from "vitest";
import { nombreDeLaRepeticion, genteParaRepetir, quienEresEnElNuevo } from "./repetirViaje";

describe("nombreDeLaRepeticion", () => {
  it("sin número, el 2", () => {
    expect(nombreDeLaRepeticion("Ibiza")).toBe("Ibiza 2");
  });

  it("con número, el siguiente", () => {
    expect(nombreDeLaRepeticion("Ibiza 2")).toBe("Ibiza 3");
    expect(nombreDeLaRepeticion("Finde 9")).toBe("Finde 10");
  });

  it("con un año, el que viene", () => {
    expect(nombreDeLaRepeticion("Ibiza 2026")).toBe("Ibiza 2027");
  });

  it("un número largo que no es año no se toca", () => {
    expect(nombreDeLaRepeticion("Ruta 66666")).toBe("Ruta 66666 2");
    expect(nombreDeLaRepeticion("Hotel 340")).toBe("Hotel 340 2");
  });

  it("si es solo un número, no lo trata como contador", () => {
    expect(nombreDeLaRepeticion("2026")).toBe("2026 2");
  });

  it("sin espacios de sobra", () => {
    expect(nombreDeLaRepeticion("  Ibiza  ")).toBe("Ibiza 2");
  });
});

describe("genteParaRepetir", () => {
  it("los nombres y dónde cobran, sin los ids", () => {
    const viajeros = [
      { id: "a", nombre: "Ana", cobro: "600111222" },
      { id: "b", nombre: "Luis" },
    ];
    expect(genteParaRepetir(viajeros)).toEqual([
      { nombre: "Ana", cobro: "600111222" },
      { nombre: "Luis", cobro: null },
    ]);
  });
});

describe("quienEresEnElNuevo", () => {
  const viejos = [{ id: "a", nombre: "Ana" }, { id: "b", nombre: "Luis" }];
  const nuevos = [{ id: "x", nombre: "Ana" }, { id: "y", nombre: "Luis" }];

  it("el mismo, por nombre", () => {
    expect(quienEresEnElNuevo("b", viejos, nuevos)).toBe("y");
  });

  it("si no eras nadie, sigues sin serlo", () => {
    expect(quienEresEnElNuevo(null, viejos, nuevos)).toBeNull();
  });

  it("si no ha pasado al nuevo, nadie", () => {
    expect(quienEresEnElNuevo("b", viejos, [{ id: "x", nombre: "Ana" }])).toBeNull();
  });
});
