import { describe, it, expect } from "vitest";
import { hayQuePasarACasa, aCasa, textoACasa, textoCambioACasa } from "./enCasa";
import { MONEDAS } from "./monedas";

describe("hayQuePasarACasa", () => {
  it("si el viaje va en otra moneda, sí", () => {
    expect(hayQuePasarACasa("JPY", "EUR")).toBe(true);
  });

  it("en la de casa no hay nada que pasar", () => {
    expect(hayQuePasarACasa("EUR", "EUR")).toBe(false);
  });

  it("los viajes de antes, sin moneda, tampoco", () => {
    expect(hayQuePasarACasa(undefined, "EUR")).toBe(false);
    expect(hayQuePasarACasa(null, "EUR")).toBe(false);
  });

  it("con una de las que van a mano no hay cambio que pedir", () => {
    const aMano = MONEDAS.find((m) => m.aMano).codigo;
    expect(hayQuePasarACasa(aMano, "EUR")).toBe(false);
    expect(hayQuePasarACasa("EUR", aMano)).toBe(false);
  });
});

describe("aCasa", () => {
  it("multiplica por el cambio y redondea al céntimo", () => {
    expect(aCasa(4000, 0.00612)).toBe(24.48);
    expect(aCasa(10, 1 / 3)).toBe(3.33);
  });

  it("sin cambio no se inventa nada", () => {
    expect(aCasa(100, null)).toBeNull();
    expect(aCasa(100, undefined)).toBeNull();
    expect(aCasa(100, 0)).toBeNull();
  });
});

describe("textoACasa", () => {
  it("con la moneda de casa y el ≈ delante", () => {
    expect(textoACasa(4000, 0.00612, "EUR")).toBe("≈ 24,48 €");
    expect(textoACasa(100, 1.08, "USD")).toBe("≈ $108,00");
  });

  it("sin cambio, nada", () => {
    expect(textoACasa(4000, null, "EUR")).toBeNull();
  });
});

describe("textoCambioACasa", () => {
  it("con las monedas flojas, al revés para que se lea", () => {
    expect(textoCambioACasa(0.00612, "JPY", "EUR")).toBe("1 EUR = 163 JPY");
  });

  it("con las fuertes, derecho", () => {
    expect(textoCambioACasa(1.17, "GBP", "EUR")).toBe("1 GBP = 1.17 EUR");
  });

  it("sin cambio, nada", () => {
    expect(textoCambioACasa(null, "JPY", "EUR")).toBeNull();
  });
});
