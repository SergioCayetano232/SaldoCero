import { describe, it, expect } from "vitest";
import { frenando, valorEnMomento } from "./contador";

describe("frenando", () => {
  it("empieza en 0 y acaba en 1", () => {
    expect(frenando(0)).toBe(0);
    expect(frenando(1)).toBe(1);
  });

  it("corre más al principio que al final", () => {
    const primeraMitad = frenando(0.5) - frenando(0);
    const segundaMitad = frenando(1) - frenando(0.5);

    expect(primeraMitad).toBeGreaterThan(segundaMitad);
  });
});

describe("valorEnMomento", () => {
  it("al principio está en la cifra de antes", () => {
    expect(valorEnMomento(40, 100, 0)).toBe(40);
  });

  it("al final llega justo a la nueva", () => {
    expect(valorEnMomento(40, 100, 1)).toBe(100);
  });

  it("a medias está entre las dos", () => {
    const cifra = valorEnMomento(40, 100, 0.5);

    expect(cifra).toBeGreaterThan(40);
    expect(cifra).toBeLessThan(100);
  });

  it("también sabe bajar", () => {
    expect(valorEnMomento(100, 40, 1)).toBe(40);
    expect(valorEnMomento(100, 40, 0.5)).toBeLessThan(100);
  });

  // El reloj del navegador puede pasarse un poco del final.
  it("no se pasa aunque el progreso sí", () => {
    expect(valorEnMomento(0, 50, 1.3)).toBe(50);
    expect(valorEnMomento(0, 50, -0.2)).toBe(0);
  });
});
