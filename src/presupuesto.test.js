import { describe, it, expect } from "vitest";
import { estadoPresupuesto, textoPresupuesto } from "./presupuesto";

describe("estadoPresupuesto", () => {
  it("sin presupuesto, nada", () => {
    expect(estadoPresupuesto(100, null)).toBeNull();
    expect(estadoPresupuesto(100, undefined)).toBeNull();
    expect(estadoPresupuesto(100, 0)).toBeNull();
  });

  it("lejos del tope, bien", () => {
    expect(estadoPresupuesto(430, 1000)).toEqual({
      porcentaje: 43,
      relleno: 0.43,
      queda: 570,
      nivel: "bien",
    });
  });

  it("del 80 % para arriba, cerca", () => {
    expect(estadoPresupuesto(799, 1000).nivel).toBe("bien");
    expect(estadoPresupuesto(800, 1000).nivel).toBe("cerca");
    expect(estadoPresupuesto(1000, 1000).nivel).toBe("cerca");
  });

  it("pasado, la barra se queda llena", () => {
    const estado = estadoPresupuesto(1030, 1000);
    expect(estado.nivel).toBe("pasado");
    expect(estado.relleno).toBe(1);
    expect(estado.porcentaje).toBe(103);
    expect(estado.queda).toBeCloseTo(-30);
  });

  it("un resto de decimales no es pasarse", () => {
    expect(estadoPresupuesto(100.004, 100).nivel).toBe("cerca");
  });

  it("sin gastar nada, todo por delante", () => {
    expect(estadoPresupuesto(0, 500)).toMatchObject({ porcentaje: 0, relleno: 0, nivel: "bien" });
  });
});

describe("textoPresupuesto", () => {
  it("lo que queda y de cuánto", () => {
    expect(textoPresupuesto(estadoPresupuesto(430, 1000), 1000, "EUR")).toBe(
      "Quedan 570.00 € de 1000.00 €"
    );
  });

  it("si os pasáis, cuánto", () => {
    expect(textoPresupuesto(estadoPresupuesto(1030, 1000), 1000, "EUR")).toBe(
      "Os pasáis 30.00 €"
    );
  });

  it("justo en el tope, quedan cero", () => {
    expect(textoPresupuesto(estadoPresupuesto(100.004, 100), 100, "USD")).toBe(
      "Quedan $0.00 de $100.00"
    );
  });
});
