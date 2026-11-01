import { describe, it, expect } from "vitest";
import { limpiarNota, LARGO_NOTA, quedanEnNota, trozosConEnlaces } from "./notas";

describe("limpiarNota", () => {
  it("quita los espacios de sobra y los saltos de línea", () => {
    expect(limpiarNota("  incluye   la\npropina ")).toBe("incluye la propina");
  });

  it("vacía o en blanco, null", () => {
    expect(limpiarNota("")).toBeNull();
    expect(limpiarNota("   ")).toBeNull();
    expect(limpiarNota(undefined)).toBeNull();
    expect(limpiarNota(null)).toBeNull();
  });

  it("se corta si es demasiado larga", () => {
    expect(limpiarNota("a".repeat(500))).toHaveLength(LARGO_NOTA);
  });
});

describe("quedanEnNota", () => {
  it("lejos del tope no dice nada", () => {
    expect(quedanEnNota("incluye la propina")).toBeNull();
    expect(quedanEnNota("")).toBeNull();
  });

  it("cerca del tope dice cuántas quedan", () => {
    expect(quedanEnNota("a".repeat(160))).toBe(40);
    expect(quedanEnNota("a".repeat(LARGO_NOTA))).toBe(0);
  });
});

describe("trozosConEnlaces", () => {
  it("sin enlaces, la nota tal cual", () => {
    expect(trozosConEnlaces("incluye la propina")).toEqual([{ texto: "incluye la propina" }]);
  });

  it("separa el enlace del texto", () => {
    expect(trozosConEnlaces("reserva: https://booking.com/r/123 pagada")).toEqual([
      { texto: "reserva: " },
      { texto: "https://booking.com/r/123", href: "https://booking.com/r/123" },
      { texto: " pagada" },
    ]);
  });

  it("a los www les pone el https", () => {
    expect(trozosConEnlaces("www.renfe.com")).toEqual([
      { texto: "www.renfe.com", href: "https://www.renfe.com" },
    ]);
  });

  it("el punto final y el paréntesis se quedan fuera", () => {
    expect(trozosConEnlaces("mira (https://maps.app/x).")).toEqual([
      { texto: "mira (" },
      { texto: "https://maps.app/x", href: "https://maps.app/x" },
      { texto: ")." },
    ]);
  });

  it("varios enlaces", () => {
    const enlaces = trozosConEnlaces("ida http://a.es y vuelta http://b.es").filter((t) => t.href);
    expect(enlaces.map((t) => t.href)).toEqual(["http://a.es", "http://b.es"]);
  });

  it("no se fía de otros esquemas", () => {
    expect(trozosConEnlaces("javascript:alert(1)")).toEqual([{ texto: "javascript:alert(1)" }]);
  });

  it("sin nota, nada", () => {
    expect(trozosConEnlaces(null)).toEqual([]);
  });
});
