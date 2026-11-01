import { describe, it, expect } from "vitest";
import { cuantosPago, textoPagados } from "./pagados";
import { BOTE } from "./bote";

const gastos = [
  { id: 1, pagadorId: "a", importe: 10, participantes: ["a", "b"] },
  { id: 2, pagadorId: "a", importe: 20, participantes: ["b"] },
  { id: 3, pagadorId: "b", importe: 5 },
  { id: 4, pagadorId: BOTE, importe: 30 },
];

describe("cuantosPago", () => {
  it("cuenta solo los que pagó, no en los que va", () => {
    expect(cuantosPago(gastos, "a")).toBe(2);
    expect(cuantosPago(gastos, "b")).toBe(1);
  });

  it("el que no ha pagado nada, cero", () => {
    expect(cuantosPago(gastos, "c")).toBe(0);
    expect(cuantosPago([], "a")).toBe(0);
  });
});

describe("textoPagados", () => {
  it("en singular y en plural", () => {
    expect(textoPagados(1)).toBe("en 1 gasto");
    expect(textoPagados(6)).toBe("en 6 gastos");
  });

  it("sin gastos no dice nada", () => {
    expect(textoPagados(0)).toBeNull();
  });
});
