import { describe, it, expect } from "vitest";
import { inclinacion } from "./inclinar";

describe("inclinacion", () => {
  it("en el centro, recta", () => {
    expect(inclinacion(100, 50, 200, 100)).toEqual({ x: 0, y: 0 });
  });

  it("en la esquina de arriba a la derecha, el máximo hacia allí", () => {
    expect(inclinacion(200, 0, 200, 100)).toEqual({ x: 6, y: 6 });
  });

  it("abajo a la izquierda, al revés", () => {
    expect(inclinacion(0, 100, 200, 100)).toEqual({ x: -6, y: -6 });
  });

  // pointermove puede llegar un pelo fuera del borde; no se pasa del máximo.
  it("fuera de la caja no se pasa", () => {
    expect(inclinacion(260, -30, 200, 100)).toEqual({ x: 6, y: 6 });
  });

  it("a medio camino, la mitad", () => {
    expect(inclinacion(150, 50, 200, 100, 10)).toEqual({ x: 0, y: 5 });
  });
});
