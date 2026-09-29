import { describe, it, expect } from "vitest";
import { umbral, esHorizontal, conResistencia, queHacer } from "./deslizar";

describe("umbral", () => {
  it("en un móvil es un tercio largo de la fila", () => {
    expect(umbral(300)).toBeCloseTo(105);
  });

  it("en pantallas anchas tiene tope", () => {
    expect(umbral(800)).toBe(110);
  });
});

describe("esHorizontal", () => {
  it("de lado, sí", () => {
    expect(esHorizontal(40, 5)).toBe(true);
    expect(esHorizontal(-40, 5)).toBe(true);
  });

  it("hacia abajo es scroll", () => {
    expect(esHorizontal(10, 40)).toBe(false);
  });

  // En diagonal no se sabe qué quiere, y ante la duda, scroll.
  it("en diagonal, tampoco", () => {
    expect(esHorizontal(30, 25)).toBe(false);
  });

  it("un temblor del dedo no cuenta", () => {
    expect(esHorizontal(5, 0)).toBe(false);
  });
});

describe("conResistencia", () => {
  it("antes del umbral sigue al dedo tal cual", () => {
    expect(conResistencia(60, 300)).toBe(60);
    expect(conResistencia(-60, 300)).toBe(-60);
  });

  it("pasado el umbral, se frena", () => {
    const movido = conResistencia(205, 300);

    expect(movido).toBeGreaterThan(105);
    expect(movido).toBeLessThan(205);
  });

  it("frena igual hacia los dos lados", () => {
    expect(conResistencia(-205, 300)).toBeCloseTo(-conResistencia(205, 300));
  });
});

describe("queHacer", () => {
  it("a la izquierda de sobra, quitar", () => {
    expect(queHacer(-120, 300)).toBe("quitar");
  });

  it("a la derecha de sobra, editar", () => {
    expect(queHacer(120, 300)).toBe("editar");
  });

  it("si no llega, nada", () => {
    expect(queHacer(-80, 300)).toBe(null);
    expect(queHacer(80, 300)).toBe(null);
    expect(queHacer(0, 300)).toBe(null);
  });

  it("sin haber medido la fila, nada", () => {
    expect(queHacer(0, 0)).toBe(null);
    expect(queHacer(-50, 0)).toBe(null);
  });

  // Lo que devuelve conResistencia tiene que seguir valiendo.
  it("con la goma puesta, sigue valiendo", () => {
    expect(queHacer(conResistencia(-200, 300), 300)).toBe("quitar");
  });
});
