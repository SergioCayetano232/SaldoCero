import { describe, it, expect } from "vitest";
import { estaCerrado, textoCerrado } from "./cerrar";
import { enCorto } from "./fechas";

describe("estaCerrado", () => {
  it("con fecha de cierre, cerrado", () => {
    expect(estaCerrado({ cerradoEn: "2026-09-30T18:00:00Z" })).toBe(true);
  });

  it("sin ella, o de los de antes, abierto", () => {
    expect(estaCerrado({ cerradoEn: null })).toBe(false);
    expect(estaCerrado({ nombre: "Viejo" })).toBe(false);
    expect(estaCerrado(null)).toBe(false);
  });
});

describe("textoCerrado", () => {
  it("dice el día en corto", () => {
    expect(textoCerrado("2026-09-11T12:00:00")).toBe(`Cerrado el ${enCorto("2026-09-11")}`);
  });

  it("el día es el de aquí, no el de Greenwich", () => {
    const cierre = new Date(2026, 8, 11, 23, 30);
    expect(textoCerrado(cierre.toISOString())).toBe(`Cerrado el ${enCorto("2026-09-11")}`);
  });
});
