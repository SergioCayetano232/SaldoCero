import { describe, it, expect } from "vitest";
import { hayQueSubir } from "./arriba";

describe("hayQueSubir", () => {
  it("arriba del todo, no", () => {
    expect(hayQueSubir(0, 800)).toBe(false);
  });

  it("habiendo bajado poco, tampoco", () => {
    expect(hayQueSubir(1200, 800)).toBe(false);
  });

  it("pasada pantalla y media, sí", () => {
    expect(hayQueSubir(1201, 800)).toBe(true);
    expect(hayQueSubir(5000, 800)).toBe(true);
  });

  it("sin saber el alto de la pantalla, no", () => {
    expect(hayQueSubir(5000, 0)).toBe(false);
  });
});
