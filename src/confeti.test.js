import { describe, it, expect } from "vitest";
import { esElUltimo, trozosDeConfeti, COLORES, CUANTOS } from "./confeti";

const anaALuis = { de: "Ana", a: "Luis", cantidad: 30, saldado: false };
const pepeALuis = { de: "Pepe", a: "Luis", cantidad: 10, saldado: false };

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
