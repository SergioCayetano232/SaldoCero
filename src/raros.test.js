import { describe, it, expect } from "vitest";
import { pareceRaro } from "./raros";

const de = (...importes) => importes.map((importe, i) => ({ id: `g${i}`, importe }));

describe("pareceRaro", () => {
  const viaje = de(15, 30, 22, 40, 18);

  it("pilla los decimales que se comieron", () => {
    expect(pareceRaro(1500, viaje)).toBe(true);
  });

  it("lo normal del viaje no extraña", () => {
    expect(pareceRaro(25, viaje)).toBe(false);
    expect(pareceRaro(80, viaje)).toBe(false);
  });

  it("por debajo de 100 no pregunta nunca", () => {
    expect(pareceRaro(99, de(2, 3, 4))).toBe(false);
  });

  it("si ya hubo uno caro, otro parecido no extraña", () => {
    const conHotel = de(15, 30, 22, 400, 18);
    expect(pareceRaro(450, conHotel)).toBe(false);
    expect(pareceRaro(1500, conHotel)).toBe(true);
  });

  it("con pocos gastos, solo a partir de 1000", () => {
    expect(pareceRaro(600, de(10))).toBe(false);
    expect(pareceRaro(1000, de(10, 12))).toBe(true);
    expect(pareceRaro(1200, [])).toBe(true);
  });

  it("cuenta lo convertido, no lo escrito en otra moneda", () => {
    const enYenes = [{ id: "x", importe: 5000, importeConvertido: 30 }, ...de(25, 35)];
    expect(pareceRaro(250, enYenes)).toBe(false);
    expect(pareceRaro(400, enYenes)).toBe(true);
  });

  it("sin importe que valga, no", () => {
    expect(pareceRaro(NaN, viaje)).toBe(false);
    expect(pareceRaro(0, viaje)).toBe(false);
  });
});
