import { describe, it, expect, vi } from "vitest";
import { vibrar, PATRONES } from "./vibrar";

describe("vibrar", () => {
  it("manda el patrón que toca", () => {
    const nav = { vibrate: vi.fn().mockReturnValue(true) };

    expect(vibrar("quitar", nav)).toBe(true);
    expect(nav.vibrate).toHaveBeenCalledWith(PATRONES.quitar);
  });

  // iPhone: no hay vibrate y no tiene que romperse nada.
  it("sin vibración en el navegador, no hace nada", () => {
    expect(vibrar("toque", {})).toBe(false);
    expect(vibrar("toque", undefined)).toBe(false);
  });

  it("un tipo que no existe no vibra", () => {
    const nav = { vibrate: vi.fn() };

    expect(vibrar("terremoto", nav)).toBe(false);
    expect(nav.vibrate).not.toHaveBeenCalled();
  });

  it("si el navegador lanza, lo aguanta", () => {
    const nav = { vibrate: vi.fn(() => { throw new Error("x"); }) };
    expect(vibrar("toque", nav)).toBe(false);
  });

  it("todas son cortas: nada pasa de medio segundo", () => {
    for (const patron of Object.values(PATRONES)) {
      const total = [].concat(patron).reduce((t, ms) => t + ms, 0);
      expect(total).toBeLessThanOrEqual(500);
    }
  });
});
