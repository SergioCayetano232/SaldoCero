import { describe, it, expect } from "vitest";
import { TEMAS, temaGuardado, siguienteTema, temaDe, temaQueToca } from "./tema";

describe("temaGuardado", () => {
  it("los que conoce, tal cual", () => {
    expect(temaGuardado("claro")).toBe("claro");
    expect(temaGuardado("oscuro")).toBe("oscuro");
  });

  it("nada o algo raro, automático", () => {
    expect(temaGuardado(null)).toBe("auto");
    expect(temaGuardado("morado")).toBe("auto");
  });
});

describe("siguienteTema", () => {
  it("da la vuelta entera y vuelve a empezar", () => {
    expect(siguienteTema("auto")).toBe("claro");
    expect(siguienteTema("claro")).toBe("oscuro");
    expect(siguienteTema("oscuro")).toBe("auto");
  });
});

describe("temaDe", () => {
  it("con su nombre e icono", () => {
    expect(temaDe("oscuro").nombre).toBe("Oscuro");
    expect(temaDe("raro").id).toBe("auto");
  });

  it("todos llevan nombre e icono", () => {
    for (const t of TEMAS) {
      expect(t.nombre).toBeTruthy();
      expect(t.icono).toBeTruthy();
    }
  });
});

describe("temaQueToca", () => {
  it("elegido a mano, manda lo elegido", () => {
    expect(temaQueToca("claro", true)).toBe("claro");
    expect(temaQueToca("oscuro", false)).toBe("oscuro");
  });

  it("en automático, lo del móvil", () => {
    expect(temaQueToca("auto", true)).toBe("oscuro");
    expect(temaQueToca("auto", false)).toBe("claro");
  });
});
