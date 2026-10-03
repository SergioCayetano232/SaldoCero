import { describe, it, expect } from "vitest";
import { limpiarNota, LARGO_NOTA } from "./notas";

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
