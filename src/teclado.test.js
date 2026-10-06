import { describe, it, expect } from "vitest";
import { esOrdenador } from "./teclado";

const con = (matches) => ({ matchMedia: () => ({ matches }) });

describe("esOrdenador", () => {
  it("con ratón, sí", () => {
    expect(esOrdenador(con(true))).toBe(true);
  });

  it("con el dedo, no", () => {
    expect(esOrdenador(con(false))).toBe(false);
  });

  it("si el navegador no sabe decirlo, mejor no", () => {
    expect(esOrdenador({})).toBe(false);
    expect(esOrdenador(undefined)).toBe(false);
  });
});
