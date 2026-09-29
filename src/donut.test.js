import { describe, it, expect } from "vitest";
import { porcentajes, trozosDelDonut, puntoMedio } from "./donut";

const suma = (lista) => lista.reduce((t, n) => t + n, 0);

describe("porcentajes", () => {
  it("lo normal", () => {
    expect(porcentajes([75, 25])).toEqual([75, 25]);
  });

  // Tres tercios redondeados por separado darían 99.
  it("siempre suman 100", () => {
    expect(suma(porcentajes([1, 1, 1]))).toBe(100);
    expect(suma(porcentajes([10, 20, 30, 7, 3.5]))).toBe(100);
    expect(suma(porcentajes([0.1, 99.9]))).toBe(100);
  });

  it("el punto que falta va al que más perdió al redondear", () => {
    // 33.33, 33.33, 33.33 -> alguien se lleva el 34, y solo uno.
    const p = porcentajes([1, 1, 1]);
    expect(p.filter((n) => n === 34)).toHaveLength(1);
  });

  it("sin nada, todo a cero", () => {
    expect(porcentajes([0, 0])).toEqual([0, 0]);
    expect(porcentajes([])).toEqual([]);
  });
});

describe("trozosDelDonut", () => {
  it("se reparten la vuelta entera", () => {
    const trozos = trozosDelDonut([30, 10]);

    expect(trozos[0]).toEqual({ inicio: 0, angulo: 270 });
    expect(trozos[1]).toEqual({ inicio: 270, angulo: 90 });
  });

  it("cada uno empieza donde acaba el anterior, más el hueco", () => {
    const [a, b] = trozosDelDonut([30, 10], 4);

    expect(a).toEqual({ inicio: 2, angulo: 266 });
    expect(b).toEqual({ inicio: 272, angulo: 86 });
  });

  it("con uno solo es el anillo entero, sin hueco", () => {
    expect(trozosDelDonut([50], 4)).toEqual([{ inicio: 0, angulo: 360 }]);
  });

  // Un trozo más pequeño que el hueco no puede medir menos de cero.
  it("un trozo diminuto no sale en negativo", () => {
    const [, diminuto] = trozosDelDonut([1000, 1], 4);
    expect(diminuto.angulo).toBe(0);
  });

  it("sin nada, sin trozos", () => {
    expect(trozosDelDonut([0, 0])).toEqual([]);
  });
});

describe("puntoMedio", () => {
  it("un trozo de arriba a la derecha tiene el medio a las tres", () => {
    const p = puntoMedio({ inicio: 0, angulo: 180 }, 70, 50);

    expect(p.x).toBeCloseTo(120);
    expect(p.y).toBeCloseTo(70);
  });

  it("el que empieza arriba del todo y es pequeño queda casi arriba", () => {
    const p = puntoMedio({ inicio: 0, angulo: 2 }, 70, 50);

    expect(p.x).toBeCloseTo(70.87, 1);
    expect(p.y).toBeCloseTo(20, 0);
  });
});
