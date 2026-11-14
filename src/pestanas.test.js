import { describe, it, expect } from "vitest";
import { pestanaDelAtajo, pestanaAlEntrar, pestanaValida } from "./pestanas";

function tecla(key, extra = {}) {
  return { key, ctrlKey: false, metaKey: false, altKey: false, target: { tagName: "BODY" }, ...extra };
}

describe("pestanaDelAtajo", () => {
  it("apuntar, buscar y filtrar van a Gastos", () => {
    for (const key of ["n", "/", "d", "f", "m", "h", "o"]) expect(pestanaDelAtajo(tecla(key))).toBe("gastos");
  });

  it("las cuentas, el bote y el presupuesto van a Cuentas", () => {
    for (const key of ["c", "b", "p", "s", "g", "e", "v"]) expect(pestanaDelAtajo(tecla(key))).toBe("cuentas");
  });

  it("los viajeros y la invitación van a Viaje", () => {
    for (const key of ["a", "i", "k"]) expect(pestanaDelAtajo(tecla(key))).toBe("viaje");
  });

  it("escribiendo en un campo, las letras son letras", () => {
    expect(pestanaDelAtajo(tecla("c", { target: { tagName: "INPUT" } }))).toBeNull();
  });

  it("con una ventana abierta, nada", () => {
    expect(pestanaDelAtajo(tecla("c"), true)).toBeNull();
  });

  it("las que no son de ninguna, nada", () => {
    expect(pestanaDelAtajo(tecla("t"))).toBeNull();
    expect(pestanaDelAtajo(tecla("c", { ctrlKey: true }))).toBeNull();
  });
});

describe("pestanaAlEntrar", () => {
  it("durante el viaje, a apuntar", () => {
    expect(pestanaAlEntrar()).toBe("gastos");
  });

  it("cerrado, a ver cómo quedáis", () => {
    expect(pestanaAlEntrar({ cerrado: true })).toBe("cuentas");
  });

  it("recién creado, sin nadie, a meter a la gente", () => {
    expect(pestanaAlEntrar({ sinViajeros: true })).toBe("viaje");
  });

  it("desde el atajo del icono, a las cuentas", () => {
    expect(pestanaAlEntrar({ aLasCuentas: true })).toBe("cuentas");
  });
});

describe("pestanaValida", () => {
  it("solo las tres", () => {
    expect(pestanaValida("cuentas")).toBe("cuentas");
    expect(pestanaValida("otra")).toBeNull();
  });
});
