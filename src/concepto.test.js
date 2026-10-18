import { describe, it, expect } from "vitest";
import { arreglarConcepto, LARGO_CONCEPTO } from "./concepto";

describe("arreglarConcepto", () => {
  it("pone la primera en mayúscula y deja lo demás", () => {
    expect(arreglarConcepto("cena")).toBe("Cena");
    expect(arreglarConcepto("cena en KFC")).toBe("Cena en KFC");
    expect(arreglarConcepto("ñoquis")).toBe("Ñoquis");
    expect(arreglarConcepto("árbol de navidad")).toBe("Árbol de navidad");
  });

  it("quita los espacios de sobra", () => {
    expect(arreglarConcepto("  cena   del  viernes ")).toBe("Cena del viernes");
  });

  it("lo que ya va bien, igual", () => {
    expect(arreglarConcepto("Taxi")).toBe("Taxi");
    expect(arreglarConcepto("2 cafés")).toBe("2 cafés");
  });

  it("si la primera palabra ya lleva mayúsculas, no se toca", () => {
    expect(arreglarConcepto("iPhone funda")).toBe("iPhone funda");
    expect(arreglarConcepto("eBay")).toBe("eBay");
  });

  it("lo que se pasa de largo se corta, sin dejar un espacio al final", () => {
    const largo = "a".repeat(LARGO_CONCEPTO - 1) + " bcd";

    expect(arreglarConcepto(largo)).toBe("A" + "a".repeat(LARGO_CONCEPTO - 2));
    expect(arreglarConcepto("x".repeat(200))).toHaveLength(LARGO_CONCEPTO);
  });

  it("vacío, vacío", () => {
    expect(arreglarConcepto("")).toBe("");
    expect(arreglarConcepto(undefined)).toBe("");
  });
});
