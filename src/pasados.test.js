import { describe, it, expect } from "vitest";
import { conCerrado } from "./pasados";

const lista = [
  { codigo: "AAA111", nombre: "Lisboa", visto: 1 },
  { codigo: "BBB222", nombre: "Fallas", visto: 2, cerrado: true },
];

describe("conCerrado", () => {
  it("le pone el candado al que se cierra sin tocar los demás", () => {
    const nueva = conCerrado(lista, "AAA111", true);
    expect(nueva[0]).toEqual({ codigo: "AAA111", nombre: "Lisboa", visto: 1, cerrado: true });
    expect(nueva[1]).toBe(lista[1]);
  });

  it("se lo quita al reabrirlo", () => {
    expect(conCerrado(lista, "BBB222", false)[1].cerrado).toBe(false);
  });

  it("no cambia el orden", () => {
    expect(conCerrado(lista, "BBB222", false).map((v) => v.codigo)).toEqual(["AAA111", "BBB222"]);
  });

  it("los guardados sin el campo cuentan como abiertos", () => {
    expect(conCerrado(lista, "AAA111", false)).toBeNull();
  });

  it("si ya estaba igual, no hay nada que guardar", () => {
    expect(conCerrado(lista, "BBB222", true)).toBeNull();
  });

  it("un viaje que no está en la lista no se añade", () => {
    expect(conCerrado(lista, "ZZZ999", true)).toBeNull();
  });
});
