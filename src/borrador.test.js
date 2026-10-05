import { describe, it, expect } from "vitest";
import { hayAlgoEscrito, borradorQueVale } from "./borrador";
import { BOTE } from "./bote";

const viajeros = [{ id: "a", nombre: "Ana" }, { id: "l", nombre: "Luis" }];
const ahora = Date.parse("2026-10-05T20:00:00Z");
const hora = 60 * 60 * 1000;

const guardado = {
  pagadorId: "a",
  importe: "40+4",
  moneda: "EUR",
  concepto: "Cena",
  categoria: "comida",
  categoriaAMano: false,
  nota: "",
  fecha: "2026-10-05",
  guardadoEn: ahora - hora,
};

describe("hayAlgoEscrito", () => {
  it("con importe, concepto o nota, sí", () => {
    expect(hayAlgoEscrito({ importe: "12" })).toBe(true);
    expect(hayAlgoEscrito({ concepto: "Taxi" })).toBe(true);
    expect(hayAlgoEscrito({ nota: "con propina" })).toBe(true);
  });

  it("solo el pagador o espacios, no", () => {
    expect(hayAlgoEscrito({ pagadorId: "a", importe: "  " })).toBe(false);
    expect(hayAlgoEscrito({})).toBe(false);
    expect(hayAlgoEscrito(null)).toBe(false);
  });
});

describe("borradorQueVale", () => {
  it("devuelve lo guardado, sin la hora", () => {
    const { guardadoEn, ...campos } = guardado;
    expect(guardadoEn).toBeTruthy();
    expect(borradorQueVale(guardado, ahora, viajeros)).toEqual(campos);
  });

  it("si no hay nada, null", () => {
    expect(borradorQueVale(null, ahora, viajeros)).toBeNull();
    expect(borradorQueVale("roto", ahora, viajeros)).toBeNull();
  });

  it("caduca a los dos días", () => {
    expect(borradorQueVale({ ...guardado, guardadoEn: ahora - 47 * hora }, ahora, viajeros)).not.toBeNull();
    expect(borradorQueVale({ ...guardado, guardadoEn: ahora - 49 * hora }, ahora, viajeros)).toBeNull();
  });

  it("sin fecha de guardado no vale", () => {
    expect(borradorQueVale({ ...guardado, guardadoEn: undefined }, ahora, viajeros)).toBeNull();
  });

  it("vacío no vale", () => {
    expect(borradorQueVale({ ...guardado, importe: "", concepto: "", nota: "" }, ahora, viajeros)).toBeNull();
  });

  it("si el que pagó ya no está, el pagador se queda sin elegir", () => {
    expect(borradorQueVale({ ...guardado, pagadorId: "se-fue" }, ahora, viajeros).pagadorId).toBe("");
  });

  it("el bote vale de pagador", () => {
    expect(borradorQueVale({ ...guardado, pagadorId: BOTE }, ahora, viajeros).pagadorId).toBe(BOTE);
  });

  it("lo que falta o viene raro, en texto", () => {
    const raro = { importe: 12, concepto: null, guardadoEn: ahora, categoriaAMano: "si" };
    expect(borradorQueVale(raro, ahora, viajeros)).toMatchObject({
      importe: "12",
      concepto: "",
      moneda: "",
      categoriaAMano: false,
    });
  });
});
