import { describe, it, expect } from "vitest";
import { resumenDelViaje, limpiarAnterior, frenteAlAnterior, textoFrenteAlAnterior } from "./anterior";

const gente = [{ id: "a" }, { id: "b" }];
const gasto = (importe, fecha) => ({ importe, importeConvertido: importe, fecha });
const dinero = (n) => `${n} €`;

describe("resumenDelViaje", () => {
  it("total, días con gastos y gente", () => {
    const gastos = [gasto(100, "2026-10-01"), gasto(50, "2026-10-01"), gasto(90, "2026-10-02")];
    expect(resumenDelViaje("Lisboa", "EUR", gastos, gente)).toEqual({ nombre: "Lisboa", moneda: "EUR", total: 240, dias: 2, personas: 2 });
  });

  it("las devoluciones restan del total", () => {
    const gastos = [gasto(100, "2026-10-01"), gasto(-20, "2026-10-02")];
    expect(resumenDelViaje("Lisboa", "EUR", gastos, gente).total).toBe(80);
  });

  it("sin gastos o sin gente, nada que guardar", () => {
    expect(resumenDelViaje("Lisboa", "EUR", [], gente)).toBeNull();
    expect(resumenDelViaje("Lisboa", "EUR", [gasto(-20, "2026-10-02")], gente)).toBeNull();
    expect(resumenDelViaje("Lisboa", "EUR", [gasto(10, "2026-10-02")], [])).toBeNull();
  });
});

describe("limpiarAnterior", () => {
  it("lo que vale, tal cual", () => {
    const a = { nombre: "Lisboa", moneda: "EUR", total: 240, dias: 2, personas: 2 };
    expect(limpiarAnterior(a)).toEqual(a);
  });

  it("si falta algo o no es un objeto, null", () => {
    expect(limpiarAnterior(null)).toBeNull();
    expect(limpiarAnterior("Lisboa")).toBeNull();
    expect(limpiarAnterior({ nombre: "Lisboa", moneda: "EUR", total: 0, dias: 2, personas: 2 })).toBeNull();
    expect(limpiarAnterior({ nombre: "Lisboa", moneda: "EUR", total: 240, dias: 2 })).toBeNull();
  });
});

describe("frenteAlAnterior", () => {
  const lisboa = { nombre: "Lisboa", moneda: "EUR", total: 400, dias: 4, personas: 2 }; // 50 por persona y día

  it("por persona y día cuando los dos tienen varios días", () => {
    expect(frenteAlAnterior({ total: 330, porPersonaYDia: 55 }, lisboa, "EUR")).toEqual({
      nombre: "Lisboa", porDia: true, antes: 50, ahora: 55, porcentaje: 10,
    });
  });

  it("si alguno es de un día, el total", () => {
    expect(frenteAlAnterior({ total: 300, porPersonaYDia: null }, lisboa, "EUR")).toMatchObject({ porDia: false, antes: 400, ahora: 300, porcentaje: -25 });
    expect(frenteAlAnterior({ total: 500, porPersonaYDia: 40 }, { ...lisboa, dias: 1 }, "EUR")).toMatchObject({ porDia: false, porcentaje: 25 });
  });

  it("en otra moneda o sin anterior, no se compara", () => {
    expect(frenteAlAnterior({ total: 330, porPersonaYDia: 55 }, lisboa, "GBP")).toBeNull();
    expect(frenteAlAnterior({ total: 330, porPersonaYDia: 55 }, null, "EUR")).toBeNull();
    expect(frenteAlAnterior(null, lisboa, "EUR")).toBeNull();
  });
});

describe("textoFrenteAlAnterior", () => {
  it("más, menos o igual", () => {
    expect(textoFrenteAlAnterior({ nombre: "Lisboa", porDia: true, antes: 50, porcentaje: 10 }, dinero)).toBe(
      "Un 10 % más que en Lisboa, que salió a 50 € por persona y día"
    );
    expect(textoFrenteAlAnterior({ nombre: "Lisboa", porDia: false, antes: 400, porcentaje: -25 }, dinero)).toBe(
      "Un 25 % menos que en Lisboa, donde gastasteis 400 €"
    );
    expect(textoFrenteAlAnterior({ nombre: "Lisboa", porDia: true, antes: 50, porcentaje: 0 }, dinero)).toBe(
      "Igual que en Lisboa, 50 € por persona y día"
    );
  });
});
