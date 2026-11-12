import { describe, it, expect } from "vitest";
import { cambiarFijado, gastosFijados, fijadosGuardados } from "./fijados";

const gastos = [
  { id: "g1", concepto: "Riad" },
  { id: "g2", concepto: "Coche" },
  { id: "g3", concepto: "Cena" },
];

describe("cambiarFijado", () => {
  it("fija el que no estaba, al final", () => {
    expect(cambiarFijado(["g2"], "g1")).toEqual(["g2", "g1"]);
  });

  it("y quita el que ya estaba", () => {
    expect(cambiarFijado(["g2", "g1"], "g2")).toEqual(["g1"]);
  });

  it("no toca la lista de antes", () => {
    const antes = ["g1"];
    cambiarFijado(antes, "g2");
    expect(antes).toEqual(["g1"]);
  });
});

describe("gastosFijados", () => {
  it("en el orden en que se fijaron, no en el de la lista", () => {
    expect(gastosFijados(gastos, ["g3", "g1"]).map((g) => g.concepto)).toEqual(["Cena", "Riad"]);
  });

  it("los borrados se saltan", () => {
    expect(gastosFijados(gastos, ["g9", "g2"]).map((g) => g.id)).toEqual(["g2"]);
  });

  it("sin fijados, nada", () => {
    expect(gastosFijados(gastos, [])).toEqual([]);
  });
});

describe("fijadosGuardados", () => {
  it("una lista de ids tal cual", () => {
    expect(fijadosGuardados(["g1", "g2"])).toEqual(["g1", "g2"]);
  });

  it("lo que no es una lista, vacío", () => {
    expect(fijadosGuardados(undefined)).toEqual([]);
    expect(fijadosGuardados({ g1: true })).toEqual([]);
    expect(fijadosGuardados("g1")).toEqual([]);
  });

  it("dentro, solo los textos", () => {
    expect(fijadosGuardados(["g1", 3, null, "g2"])).toEqual(["g1", "g2"]);
  });
});
