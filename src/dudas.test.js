import { describe, it, expect } from "vitest";
import { limpiarDuda, aQuienSePregunta, dudasParaMi, textoDuda, avisoDeDudas, DUDA_POR_DEFECTO, LARGO_DUDA } from "./dudas";

const viajeros = [
  { id: "a", nombre: "Ana" },
  { id: "l", nombre: "Luis" },
  { id: "m", nombre: "Marta" },
];
const cena = { id: "g1", concepto: "Cena", pagadorId: "a", creadoPor: "m" };

describe("limpiarDuda", () => {
  it("sin escribir nada, la de siempre", () => {
    expect(limpiarDuda("")).toBe(DUDA_POR_DEFECTO);
    expect(limpiarDuda("   ")).toBe(DUDA_POR_DEFECTO);
    expect(limpiarDuda(undefined)).toBe(DUDA_POR_DEFECTO);
  });

  it("sin espacios de más ni saltos de línea", () => {
    expect(limpiarDuda("  ¿esto  era\nel taxi? ")).toBe("¿esto era el taxi?");
  });

  it("corta lo que pase del largo", () => {
    expect(limpiarDuda("a".repeat(300))).toHaveLength(LARGO_DUDA);
  });
});

describe("aQuienSePregunta", () => {
  it("al que lo apuntó", () => {
    expect(aQuienSePregunta(cena)).toBe("m");
  });

  it("si no se sabe, al que pagó", () => {
    expect(aQuienSePregunta({ ...cena, creadoPor: null })).toBe("a");
  });

  it("del bote o entre varios sin saber quién lo apuntó, a nadie", () => {
    expect(aQuienSePregunta({ ...cena, creadoPor: null, pagadorId: "bote" })).toBeNull();
    expect(aQuienSePregunta({ ...cena, creadoPor: null, pagadores: { a: 20, l: 10 } })).toBeNull();
  });
});

describe("dudasParaMi", () => {
  const conDuda = { ...cena, duda: "¿Esto qué es?", dudaPor: "l" };

  it("las de los gastos que apuntaste tú", () => {
    expect(dudasParaMi([cena, conDuda], "m")).toEqual([conDuda]);
    expect(dudasParaMi([conDuda], "a")).toEqual([]);
  });

  it("las que preguntaste tú no", () => {
    expect(dudasParaMi([{ ...conDuda, dudaPor: "m" }], "m")).toEqual([]);
  });

  it("si no sabemos quién eres, ninguna", () => {
    expect(dudasParaMi([conDuda], null)).toEqual([]);
  });
});

describe("textoDuda", () => {
  it("quién pregunta", () => {
    expect(textoDuda({ ...cena, duda: "¿Y esto?", dudaPor: "l" }, viajeros, "a")).toBe("Luis pregunta: ¿Y esto?");
  });

  it("si fuiste tú", () => {
    expect(textoDuda({ ...cena, duda: "¿Y esto?", dudaPor: "l" }, viajeros, "l")).toBe("Has preguntado: ¿Y esto?");
  });

  it("sin saber quién, alguien", () => {
    expect(textoDuda({ ...cena, duda: "¿Y esto?", dudaPor: null }, viajeros, null)).toBe("Alguien pregunta: ¿Y esto?");
  });

  it("sin duda, nada", () => {
    expect(textoDuda(cena, viajeros, "a")).toBeNull();
  });
});

describe("avisoDeDudas", () => {
  it("una, con el gasto y la pregunta", () => {
    expect(avisoDeDudas([{ ...cena, duda: "¿Esto qué es?", dudaPor: "l" }], viajeros)).toBe('Luis te pregunta por "Cena": ¿Esto qué es?');
  });

  it("varias, cuántas", () => {
    const d = { ...cena, duda: "?", dudaPor: "l" };
    expect(avisoDeDudas([d, { ...d, id: "g2" }], viajeros)).toBe("Te han preguntado por 2 gastos");
  });

  it("ninguna, nada", () => {
    expect(avisoDeDudas([], viajeros)).toBeNull();
  });
});
