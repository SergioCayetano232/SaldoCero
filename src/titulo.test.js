import { describe, it, expect } from "vitest";
import { tituloDePestana, TITULO_SIN_VIAJE } from "./titulo";

describe("tituloDePestana", () => {
  it("con viaje, su nombre delante", () => {
    expect(tituloDePestana("Lisboa")).toBe("Lisboa · SaldoCero");
  });

  it("sin viaje, el de siempre", () => {
    expect(tituloDePestana(null)).toBe(TITULO_SIN_VIAJE);
  });

  it("con el nombre vacío, también el de siempre", () => {
    expect(tituloDePestana("  ")).toBe(TITULO_SIN_VIAJE);
  });
});
