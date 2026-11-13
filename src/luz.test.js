import { describe, it, expect } from "vitest";
import { dondeLaLuz, esRaton } from "./luz";

describe("dondeLaLuz", () => {
  it("cuenta desde la esquina de la tarjeta", () => {
    expect(dondeLaLuz(150, 320, { left: 100, top: 300 })).toEqual({ x: 50, y: 20 });
  });

  it("redondea, que el CSS no necesita decimales", () => {
    expect(dondeLaLuz(10.6, 5.2, { left: 0.1, top: 0 })).toEqual({ x: 11, y: 5 });
  });

  // Puede salir negativo si el ratón va por el borde; la luz queda medio fuera y ya.
  it("fuera de la tarjeta da negativo", () => {
    expect(dondeLaLuz(90, 290, { left: 100, top: 300 })).toEqual({ x: -10, y: -10 });
  });
});

describe("esRaton", () => {
  it("ratón y lápiz sí", () => {
    expect(esRaton({ pointerType: "mouse" })).toBe(true);
    expect(esRaton({ pointerType: "pen" })).toBe(true);
  });

  it("el dedo no", () => {
    expect(esRaton({ pointerType: "touch" })).toBe(false);
  });
});
