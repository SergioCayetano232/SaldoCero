import { describe, it, expect } from "vitest";
import { radioDeLaOnda, siguienteOnda } from "./onda";

describe("radioDeLaOnda", () => {
  it("desde el centro llega a las esquinas", () => {
    // Botón de 80 × 60: del centro a una esquina, 50.
    expect(radioDeLaOnda(40, 30, 80, 60)).toBe(50);
  });

  it("desde una esquina tiene que cruzar el botón entero", () => {
    expect(radioDeLaOnda(0, 0, 80, 60)).toBe(100);
    expect(radioDeLaOnda(80, 60, 80, 60)).toBe(100);
  });

  it("redondea hacia arriba, que no quede un pico sin cubrir", () => {
    expect(radioDeLaOnda(0, 0, 10, 10)).toBe(15);
  });
});

describe("siguienteOnda", () => {
  it("va alternando", () => {
    expect(siguienteOnda("a")).toBe("b");
    expect(siguienteOnda("b")).toBe("a");
  });

  // La primera vez el botón aún no tiene nada.
  it("sin nada empieza por la a", () => {
    expect(siguienteOnda(undefined)).toBe("a");
  });
});
