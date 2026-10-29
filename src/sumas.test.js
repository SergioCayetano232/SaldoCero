import { describe, it, expect } from "vitest";
import { leerSuma, esSuma, llevaSigno, ponerSigno, signoColgando, cabePorciento, ponerPorciento } from "./sumas";

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

  it("con el símbolo de la moneda pegado, delante o detrás", () => {
    expect(leerSuma("25€")).toBe(25);
    expect(leerSuma("25 €")).toBe(25);
    expect(leerSuma("€25")).toBe(25);
    expect(leerSuma("12,50 €")).toBe(12.5);
    expect(leerSuma("$12.99")).toBe(12.99);
    expect(leerSuma("£8")).toBe(8);
    expect(leerSuma("¥3000")).toBe(3000);
  });

  it("y en las sumas también", () => {
    expect(leerSuma("25 € + 10 €")).toBe(35);
    expect(leerSuma("3×4,50€")).toBe(13.5);
  });

  it("el símbolo solo no es un importe", () => {
    expect(leerSuma("€")).toBeNull();
    expect(leerSuma("€+")).toBeNull();
  });

  it("el + del final no cuenta, que vas a escribir otro", () => {
    expect(leerSuma("12+")).toBe(12);
  });

  it("resta, y mezclada con sumas", () => {
    expect(leerSuma("60-10")).toBe(50);
    expect(leerSuma("45,60-5,60+2")).toBe(42);
    expect(leerSuma("12-")).toBe(12);
  });

  it("multiplica, con ×, x o *", () => {
    expect(leerSuma("3×4,5")).toBe(13.5);
    expect(leerSuma("3x4,5")).toBe(13.5);
    expect(leerSuma("3X4,5")).toBe(13.5);
    expect(leerSuma("3*4,5")).toBe(13.5);
    expect(leerSuma("3×")).toBe(3);
  });

  it("primero multiplica y luego suma y resta", () => {
    expect(leerSuma("2+3×4")).toBe(14);
    expect(leerSuma("60-2×5")).toBe(50);
    expect(leerSuma("3×2,5+4×1,20")).toBe(12.3);
  });

  it("una multiplicación a medias no se entiende", () => {
    expect(leerSuma("3××4")).toBeNull();
    expect(leerSuma("×4")).toBeNull();
    expect(leerSuma("3×+4")).toBeNull();
    expect(leerSuma("12÷÷3")).toBeNull();
    expect(leerSuma("÷3")).toBeNull();
  });

  it("divide, con ÷ o /", () => {
    expect(leerSuma("120÷4")).toBe(30);
    expect(leerSuma("120/4")).toBe(30);
    expect(leerSuma("100÷3")).toBe(33.33);
    expect(leerSuma("120÷")).toBe(120);
  });

  it("multiplica y divide de izquierda a derecha, antes que sumar", () => {
    expect(leerSuma("90÷3×2")).toBe(60);
    expect(leerSuma("10+60÷4")).toBe(25);
    expect(leerSuma("80-40÷2")).toBe(60);
  });

  it("entre cero no se puede", () => {
    expect(leerSuma("50÷0")).toBeNull();
    expect(leerSuma("50÷0,0")).toBeNull();
  });

  it("si se pasa restando, sale cero o negativo, sin más", () => {
    expect(leerSuma("10-10")).toBe(0);
    expect(leerSuma("10-20")).toBe(-10);
  });

  it("porcentajes: el descuento y la propina", () => {
    expect(leerSuma("120-10%")).toBe(108);
    expect(leerSuma("45+10%")).toBe(49.5);
    expect(leerSuma("80 - 12,5 %")).toBe(70);
  });

  it("el % va sobre lo que llevas hasta ahí", () => {
    expect(leerSuma("60+5+10%")).toBe(71.5);
    expect(leerSuma("60+10%+5")).toBe(71);
    expect(leerSuma("2×30-10%")).toBe(54);
  });

  it("multiplicando, el 15% es 0,15", () => {
    expect(leerSuma("200×15%")).toBe(30);
    expect(leerSuma("15%×200")).toBe(30);
  });

  it("un % sin nada delante, o a medias, no se entiende", () => {
    expect(leerSuma("10%")).toBeNull();
    expect(leerSuma("50-%")).toBeNull();
    expect(leerSuma("50-10%%")).toBeNull();
    expect(leerSuma("50-10%5")).toBeNull();
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
    expect(esSuma("3×4")).toBe(true);
    expect(esSuma("3×")).toBe(false);
    expect(esSuma("120÷4")).toBe(true);
    expect(esSuma("120÷")).toBe(false);
  });

  it("con un %, también, para avisar si está mal", () => {
    expect(esSuma("120-10%")).toBe(true);
    expect(esSuma("10%")).toBe(true);
  });

  it("un número solo, o con el + colgando, no", () => {
    expect(esSuma("12")).toBe(false);
    expect(esSuma("25 €")).toBe(false);
    expect(esSuma("12+")).toBe(false);
    expect(esSuma("")).toBe(false);
  });
});

describe("llevaSigno", () => {
  it("cuenta el signo colgando, que ya vas a escribir otro", () => {
    expect(llevaSigno("60+")).toBe(true);
    expect(llevaSigno("60-10")).toBe(true);
    expect(llevaSigno("3×")).toBe(true);
    expect(llevaSigno("120÷")).toBe(true);
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
    expect(ponerSigno("3x", "+")).toBe("3+");
    expect(ponerSigno("3+", "×")).toBe("3×");
    expect(ponerSigno("120×", "÷")).toBe("120÷");
  });
});

describe("signoColgando", () => {
  it("el que haya al final, y los de multiplicar como ×", () => {
    expect(signoColgando("60+")).toBe("+");
    expect(signoColgando("60-")).toBe("-");
    expect(signoColgando("3x")).toBe("×");
    expect(signoColgando("3* ")).toBe("×");
    expect(signoColgando("120÷")).toBe("÷");
    expect(signoColgando("120/")).toBe("÷");
  });

  it("si acaba en número, ninguno", () => {
    expect(signoColgando("60-10")).toBeNull();
    expect(signoColgando("")).toBeNull();
  });
});

describe("cabePorciento", () => {
  it("detrás del número de una cuenta", () => {
    expect(cabePorciento("120-10")).toBe(true);
    expect(cabePorciento("200×15")).toBe(true);
  });

  it("con un número solo, un signo colgando o ya puesto, no", () => {
    expect(cabePorciento("120")).toBe(false);
    expect(cabePorciento("120-")).toBe(false);
    expect(cabePorciento("120-10%")).toBe(false);
    expect(cabePorciento("")).toBe(false);
  });
});

describe("ponerPorciento", () => {
  it("lo pone al final", () => {
    expect(ponerPorciento(" 120-10 ")).toBe("120-10%");
  });
});
