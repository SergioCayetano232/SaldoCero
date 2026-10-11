import { describe, it, expect } from "vitest";
import { esElUltimo, sonLosUltimos, trozosDeConfeti, COLORES, CUANTOS } from "./confeti";

const anaALuis = { de: "Ana", a: "Luis", cantidad: 30, saldado: false };
const pepeALuis = { de: "Pepe", a: "Luis", cantidad: 10, saldado: false };

describe("sonLosUltimos", () => {
  it("si con estos ya no queda nada, toca fiesta", () => {
    expect(sonLosUltimos([anaALuis, pepeALuis], [anaALuis, pepeALuis])).toBe(true);
  });

  it("si queda otro fuera, todavía no", () => {
    const martaAPepe = { de: "Marta", a: "Pepe", cantidad: 5, saldado: false };
    expect(sonLosUltimos([anaALuis, pepeALuis, martaAPepe], [anaALuis, pepeALuis])).toBe(false);
  });

  it("sin nada pendiente, no", () => {
    expect(sonLosUltimos([{ ...anaALuis, saldado: true }], [])).toBe(false);
  });
});

describe("esElUltimo", () => {
  it("con un solo pago pendiente, ese es el último", () => {
    expect(esElUltimo([anaALuis], anaALuis)).toBe(true);
  });

  it("si queda otro por pagar, todavía no", () => {
    expect(esElUltimo([anaALuis, pepeALuis], anaALuis)).toBe(false);
  });

  it("los ya pagados no cuentan", () => {
    const pagos = [anaALuis, { ...pepeALuis, saldado: true }];
    expect(esElUltimo(pagos, anaALuis)).toBe(true);
  });

  // Desmarcar el último no es para celebrarlo.
  it("si el pago ya estaba saldado, no", () => {
    const hecho = { ...anaALuis, saldado: true };
    expect(esElUltimo([hecho], hecho)).toBe(false);
  });

  it("sin pagos, nada", () => {
    expect(esElUltimo([], anaALuis)).toBe(false);
  });
});

describe("trozosDeConfeti", () => {
  it("por defecto saca los que toca", () => {
    expect(trozosDeConfeti()).toHaveLength(CUANTOS);
  });

  it("cada trozo cae dentro de la pantalla y con un color de los nuestros", () => {
    for (const trozo of trozosDeConfeti(200)) {
      expect(trozo.x).toBeGreaterThanOrEqual(0);
      expect(trozo.x).toBeLessThanOrEqual(100);
      expect(COLORES).toContain(trozo.color);
      expect(trozo.duracion).toBeGreaterThan(0);
    }
  });

  it("con el mismo azar sale lo mismo", () => {
    const fijo = () => 0.5;
    expect(trozosDeConfeti(3, fijo)).toEqual(trozosDeConfeti(3, fijo));
  });

  // Con el azar a tope no se sale de la lista de colores.
  it("aguanta los extremos del azar", () => {
    const [trozo] = trozosDeConfeti(1, () => 0.9999);
    expect(COLORES).toContain(trozo.color);
  });
});

describe("esElUltimo con nombres repetidos", () => {
  const aAnaA = { de: "Pepe", a: "Ana", deId: "p", aId: "a1", cantidad: 30, saldado: false };
  const aAnaB = { de: "Pepe", a: "Ana", deId: "p", aId: "a2", cantidad: 20, saldado: true };

  it("distingue a cuál de las dos Anas va", () => {
    expect(esElUltimo([aAnaA, aAnaB], aAnaA)).toBe(true);
    expect(esElUltimo([aAnaA, { ...aAnaB, saldado: false }], aAnaA)).toBe(false);
  });
});
