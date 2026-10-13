import { describe, it, expect } from "vitest";
import { leerSuma, esSuma, llevaSigno, ponerSigno } from "./sumas";

describe("leerSuma", () => {
  it("un número solo, como siempre", () => {
    expect(leerSuma("45")).toBe(45);
    expect(leerSuma("12.5")).toBe(12.5);
    expect(leerSuma("12,5")).toBe(12.5);
  });

  it("suma con coma o punto, y con espacios", () => {
    expect(leerSuma("12,5+8+3.20")).toBe(23.7);
    expect(leerSuma(" 10 + 5 ")).toBe(15);
  });

  it("sin los restos de los decimales", () => {
    expect(leerSuma("0.1+0.2")).toBe(0.3);
  });

  it("el + del final no cuenta, que vas a escribir otro", () => {
    expect(leerSuma("12+")).toBe(12);
  });

  it("resta, y mezclada con sumas", () => {
    expect(leerSuma("60-10")).toBe(50);
    expect(leerSuma("45,60-5,60+2")).toBe(42);
    expect(leerSuma("12-")).toBe(12);
  });

  it("si se pasa restando, sale cero o negativo, sin más", () => {
    expect(leerSuma("10-10")).toBe(0);
    expect(leerSuma("10-20")).toBe(-10);
  });

  it("los que empiezan por coma", () => {
    expect(leerSuma(",5+1")).toBe(1.5);
  });

  it("lo que no se entiende, null", () => {
    expect(leerSuma("")).toBeNull();
    expect(leerSuma("abc")).toBeNull();
    expect(leerSuma("12++8")).toBeNull();
    expect(leerSuma("+12")).toBeNull();
    expect(leerSuma("-12")).toBeNull();
    expect(leerSuma("12+-3")).toBeNull();
    expect(leerSuma("1.234,5")).toBeNull();
    expect(leerSuma(undefined)).toBeNull();
  });
});

describe("esSuma", () => {
  it("con dos o más sumandos, sí", () => {
    expect(esSuma("12+8")).toBe(true);
    expect(esSuma("1 + 2 + 3")).toBe(true);
  });

  it("con una resta, también", () => {
    expect(esSuma("60-10")).toBe(true);
    expect(esSuma("60-")).toBe(false);
  });

  it("un número solo, o con el + colgando, no", () => {
    expect(esSuma("12")).toBe(false);
    expect(esSuma("12+")).toBe(false);
    expect(esSuma("")).toBe(false);
  });
});

describe("llevaSigno", () => {
  it("cuenta el signo colgando, que ya vas a escribir otro", () => {
    expect(llevaSigno("60+")).toBe(true);
    expect(llevaSigno("60-10")).toBe(true);
    expect(llevaSigno("60")).toBe(false);
    expect(llevaSigno("")).toBe(false);
  });
});

describe("ponerSigno", () => {
  it("lo pone al final", () => {
    expect(ponerSigno("60", "-")).toBe("60-");
    expect(ponerSigno(" 12,5 ", "+")).toBe("12,5+");
  });

  it("si ya había uno colgando, lo cambia", () => {
    expect(ponerSigno("60+", "-")).toBe("60-");
    expect(ponerSigno("60-10-", "+")).toBe("60-10+");
  });
});
