import { describe, it, expect } from "vitest";
import { limpiarTopes, conTope, estadoDeTopes, sinTope, teSacaDelTope } from "./topes";

const gasto = (categoria, importe) => ({ categoria, importe, importeConvertido: importe });
const gastos = [gasto("comida", 120), gasto("comida", 150), gasto("transporte", 40), { importe: 10, importeConvertido: 10 }];

describe("limpiarTopes", () => {
  it("solo categorías que existen y con cifra", () => {
    expect(limpiarTopes({ comida: 300, ocio: "50", rara: 10, compras: 0, otros: -5, transporte: "x" })).toEqual({ comida: 300, ocio: 50 });
  });

  it("sin nada, o roto, vacío", () => {
    expect(limpiarTopes(null)).toEqual({});
    expect(limpiarTopes("300")).toEqual({});
  });
});

describe("conTope", () => {
  it("pone, cambia y quita", () => {
    expect(conTope({}, "comida", 300)).toEqual({ comida: 300 });
    expect(conTope({ comida: 300 }, "comida", 200)).toEqual({ comida: 200 });
    expect(conTope({ comida: 300, ocio: 50 }, "comida", null)).toEqual({ ocio: 50 });
  });

  it("si no queda ninguno, null", () => {
    expect(conTope({ comida: 300 }, "comida", null)).toBeNull();
  });

  it("no toca el que le pasas", () => {
    const antes = { comida: 300 };
    conTope(antes, "ocio", 50);
    expect(antes).toEqual({ comida: 300 });
  });
});

describe("estadoDeTopes", () => {
  it("lo gastado en cada una con tope, en el orden de siempre", () => {
    const [transporte, comida] = estadoDeTopes(gastos, { transporte: 50, comida: 300 }).reverse();
    expect(comida).toMatchObject({ id: "comida", tope: 300, gastado: 270, estado: { nivel: "cerca", queda: 30 } });
    expect(transporte).toMatchObject({ id: "transporte", gastado: 40 });
  });

  it("los gastos sin categoría van a otros", () => {
    expect(estadoDeTopes(gastos, { otros: 5 })[0]).toMatchObject({ gastado: 10, estado: { nivel: "pasado" } });
  });

  it("una devolución resta, pero no baja de cero", () => {
    const [ocio] = estadoDeTopes([gasto("ocio", 20), gasto("ocio", -50)], { ocio: 100 });
    expect(ocio.gastado).toBe(0);
  });
});

describe("sinTope", () => {
  it("las que quedan por ponerle", () => {
    expect(sinTope({ comida: 300, ocio: 20 }).map((c) => c.id)).toEqual(["transporte", "alojamiento", "compras", "otros"]);
  });
});

describe("teSacaDelTope", () => {
  it("lo que se pasaría con este gasto", () => {
    expect(teSacaDelTope(gastos, "comida", 50, { comida: 300 })).toBe(20);
    expect(teSacaDelTope(gastos, "comida", 20, { comida: 300 })).toBeNull();
  });

  it("sin tope en esa categoría, nada", () => {
    expect(teSacaDelTope(gastos, "ocio", 500, { comida: 300 })).toBeNull();
  });

  it("si ya ibais pasados, no lo repite", () => {
    expect(teSacaDelTope(gastos, "comida", 10, { comida: 200 })).toBeNull();
  });
});
