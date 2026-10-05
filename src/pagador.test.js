import { describe, it, expect } from "vitest";
import { pagadorPorDefecto } from "./pagador";

const viajeros = [
  { id: "a", nombre: "Ana" },
  { id: "b", nombre: "Bea" },
];

describe("pagadorPorDefecto", () => {
  it("si sabes quién eres, eres tú", () => {
    expect(pagadorPorDefecto("b", viajeros)).toBe("b");
  });

  it("sin haberlo dicho, en blanco", () => {
    expect(pagadorPorDefecto(null, viajeros)).toBe("");
    expect(pagadorPorDefecto("", viajeros)).toBe("");
  });

  it("si te quitaron del viaje, en blanco", () => {
    expect(pagadorPorDefecto("c", viajeros)).toBe("");
  });

  it("sin viajeros todavía, en blanco", () => {
    expect(pagadorPorDefecto("a", [])).toBe("");
  });
});
