import { describe, it, expect } from "vitest";
import { limpiarLugar, mismoLugar, lugaresDelViaje, lugarSugerido, porLugar, LARGO_LUGAR } from "./lugares";

const g = (id, lugar, fecha, importe = 10, creadoEn = `${fecha}T12:00:00Z`) => ({ id, lugar, fecha, importe, importeConvertido: importe, creadoEn });

describe("limpiarLugar", () => {
  it("sin espacios de más y con mayúscula", () => {
    expect(limpiarLugar("  roma ")).toBe("Roma");
    expect(limpiarLugar("san  sebastián")).toBe("San sebastián");
    expect(limpiarLugar("ávila")).toBe("Ávila");
  });

  it("vacío, null", () => {
    expect(limpiarLugar("")).toBeNull();
    expect(limpiarLugar("   ")).toBeNull();
    expect(limpiarLugar(null)).toBeNull();
  });

  it("corta lo que pase del largo", () => {
    expect(limpiarLugar("a".repeat(100))).toHaveLength(LARGO_LUGAR);
  });
});

describe("mismoLugar", () => {
  it("sin mirar mayúsculas ni tildes", () => {
    expect(mismoLugar("Cádiz", "cadiz")).toBe(true);
    expect(mismoLugar("Roma", "Milán")).toBe(false);
    expect(mismoLugar(null, null)).toBe(false);
  });
});

describe("lugaresDelViaje", () => {
  it("la más usada primero, escrita como la primera vez", () => {
    const gastos = [g(1, "Roma", "2026-09-10"), g(2, "Florencia", "2026-09-12"), g(3, "florencia", "2026-09-12"), g(4, null, "2026-09-12")];
    expect(lugaresDelViaje(gastos)).toEqual(["Florencia", "Roma"]);
  });

  it("sin lugares, nada", () => {
    expect(lugaresDelViaje([g(1, null, "2026-09-10")])).toEqual([]);
  });
});

describe("lugarSugerido", () => {
  const gastos = [
    g(1, "Roma", "2026-09-10"),
    g(2, "Roma", "2026-09-11"),
    g(3, "Florencia", "2026-09-13", 10, "2026-09-13T09:00:00Z"),
    g(4, "Pisa", "2026-09-13", 10, "2026-09-13T18:00:00Z"),
  ];

  it("lo último apuntado ese día", () => {
    expect(lugarSugerido(gastos, "2026-09-13")).toBe("Pisa");
  });

  it("si ese día no hay nada, lo del último día de antes", () => {
    expect(lugarSugerido(gastos, "2026-09-12")).toBe("Roma");
    expect(lugarSugerido(gastos, "2026-09-20")).toBe("Pisa");
  });

  it("antes del primero, o sin lugares, nada", () => {
    expect(lugarSugerido(gastos, "2026-09-01")).toBeNull();
    expect(lugarSugerido([g(1, null, "2026-09-10")], "2026-09-10")).toBeNull();
  });
});

describe("porLugar", () => {
  it("lo de cada sitio, el que más primero y lo que no tiene lugar al final", () => {
    const gastos = [g(1, "Roma", "2026-09-10", 100), g(2, "Florencia", "2026-09-12", 50), g(3, "roma", "2026-09-11", 30), g(4, null, "2026-09-12", 500)];
    expect(porLugar(gastos)).toEqual([
      { lugar: "Roma", total: 130, cuantos: 2 },
      { lugar: "Florencia", total: 50, cuantos: 1 },
      { lugar: null, total: 500, cuantos: 1 },
    ]);
  });

  it("las devoluciones restan", () => {
    const gastos = [g(1, "Roma", "2026-09-10", 100), g(2, "Roma", "2026-09-10", -20), g(3, "Pisa", "2026-09-12", 10)];
    expect(porLugar(gastos)[0]).toEqual({ lugar: "Roma", total: 80, cuantos: 2 });
  });

  it("con un sitio solo, nada", () => {
    expect(porLugar([g(1, "Roma", "2026-09-10"), g(2, null, "2026-09-10")])).toEqual([]);
  });
});
