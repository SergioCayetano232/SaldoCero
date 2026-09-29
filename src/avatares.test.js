import { describe, it, expect } from "vitest";
import { inicial, coloresDelViaje, COLORES_AVATAR } from "./avatares";

describe("inicial", () => {
  it("la primera letra, en mayúscula", () => {
    expect(inicial("ana")).toBe("A");
    expect(inicial("  luis")).toBe("L");
  });

  it("respeta las tildes y la ñ", () => {
    expect(inicial("álvaro")).toBe("Á");
    expect(inicial("ñoño")).toBe("Ñ");
  });

  it("no rompe un emoji", () => {
    expect(inicial("🐙 Pulpo")).toBe("🐙");
  });

  it("sin nombre, una interrogación", () => {
    expect(inicial("")).toBe("?");
    expect(inicial("   ")).toBe("?");
    expect(inicial(undefined)).toBe("?");
  });
});

describe("coloresDelViaje", () => {
  it("a cada uno le da un color de la paleta", () => {
    const colores = coloresDelViaje(["Ana", "Luis"]);

    expect(COLORES_AVATAR).toContain(colores.get("Ana"));
    expect(COLORES_AVATAR).toContain(colores.get("Luis"));
  });

  it("el mismo viaje saca siempre los mismos colores", () => {
    const nombres = ["Ana", "Luis", "Pepe"];
    expect(coloresDelViaje(nombres)).toEqual(coloresDelViaje(nombres));
  });

  it("no le importan las mayúsculas", () => {
    expect(coloresDelViaje(["ana"]).get("ana")).toBe(coloresDelViaje(["ANA"]).get("ANA"));
  });

  it("en un viaje no se repiten mientras haya colores", () => {
    const nombres = ["Ana", "Luis", "Pepe", "Marta", "Juan", "Lucía", "Sergio", "Eva"];
    const colores = coloresDelViaje(nombres);

    expect(new Set(colores.values()).size).toBe(nombres.length);
  });

  it("con más gente que colores, a todos les toca alguno", () => {
    const nombres = Array.from({ length: 12 }, (_, i) => `Viajero ${i}`);
    const colores = coloresDelViaje(nombres);

    for (const nombre of nombres) expect(COLORES_AVATAR).toContain(colores.get(nombre));
  });

  it("quitar al último no les cambia el color a los de antes", () => {
    const todos = coloresDelViaje(["Ana", "Luis", "Pepe", "Marta"]);
    const sinMarta = coloresDelViaje(["Ana", "Luis", "Pepe"]);

    for (const nombre of ["Ana", "Luis", "Pepe"]) {
      expect(sinMarta.get(nombre)).toBe(todos.get(nombre));
    }
  });
});

// La inicial va en blanco: con menos de 3 a 1 de contraste no se lee bien.
describe("la paleta", () => {
  function luz(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  it("todos se leen con letra blanca", () => {
    for (const color of COLORES_AVATAR) {
      expect(1.05 / (luz(color) + 0.05)).toBeGreaterThanOrEqual(3);
    }
  });
});
