import { describe, it, expect } from "vitest";
import { conCerrado, conNeto, monedaEnLista } from "./pasados";

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

describe("monedaEnLista", () => {
  it("la de fuera, con su bandera", () => {
    expect(monedaEnLista("GBP", "EUR")).toBe("🇬🇧 GBP");
  });

  it("la de casa no sale", () => {
    expect(monedaEnLista("EUR", "EUR")).toBe("");
    expect(monedaEnLista("MXN", "MXN")).toBe("");
  });

  it("para uno de México, el euro sí es de fuera", () => {
    expect(monedaEnLista("EUR", "MXN")).toBe("🇪🇺 EUR");
  });

  it("los guardados sin moneda, nada", () => {
    expect(monedaEnLista(undefined, "EUR")).toBe("");
  });
});

describe("conNeto", () => {
  it("apunta lo tuyo en ese viaje sin tocar los demás", () => {
    const nueva = conNeto(lista, "AAA111", -12.5);
    expect(nueva[0].neto).toBe(-12.5);
    expect(nueva[1]).toBe(lista[1]);
  });

  it("si no ha cambiado, no hay nada que guardar", () => {
    const conAlgo = [{ ...lista[0], neto: 20 }];
    expect(conNeto(conAlgo, "AAA111", 20)).toBeNull();
  });

  it("los guardados sin el campo cuentan como sin saber", () => {
    expect(conNeto(lista, "AAA111", null)).toBeNull();
    expect(conNeto(lista, "AAA111", 0)[0].neto).toBe(0);
  });

  it("un viaje que no está en la lista, nada", () => {
    expect(conNeto(lista, "ZZZ999", 5)).toBeNull();
  });
});
