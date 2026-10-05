import { describe, it, expect } from "vitest";
import { conPropina, PROPINAS } from "./propina";
import { leerSuma } from "./sumas";

describe("conPropina", () => {
  it("la añade como un sumando más", () => {
    expect(conPropina("40", 10)).toBe("40+4");
    expect(conPropina("40", 5)).toBe("40+2");
  });

  it("con coma y sin ceros de más", () => {
    expect(conPropina("45", 10)).toBe("45+4,5");
    expect(conPropina("20,5", 10)).toBe("20,5+2,05");
  });

  it("redondea a céntimos", () => {
    expect(conPropina("33,33", 10)).toBe("33,33+3,33");
  });

  it("sobre una suma, calcula sobre el total", () => {
    expect(conPropina("12,5+8", 10)).toBe("12,5+8+2,05");
  });

  it("el + del final no se duplica", () => {
    expect(conPropina("40+", 10)).toBe("40+4");
  });

  it("lo que sale se lee bien como suma", () => {
    expect(leerSuma(conPropina("37,80", 10))).toBe(41.58);
  });

  it("sin importe que se entienda, null", () => {
    expect(conPropina("", 10)).toBeNull();
    expect(conPropina("abc", 10)).toBeNull();
    expect(conPropina("0", 10)).toBeNull();
  });

  it("si la propina no llega a un céntimo, null", () => {
    expect(conPropina("0,04", 10)).toBeNull();
  });

  it("los porcentajes que se ofrecen", () => {
    expect(PROPINAS).toEqual([5, 10]);
  });
});
