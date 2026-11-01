import { describe, it, expect } from "vitest";
import { trozosDeDeuda } from "./aCuenta";
import { leerImporte } from "./monedas";

describe("trozosDeDeuda", () => {
  it("da la mitad y todo, con coma", () => {
    expect(trozosDeDeuda(40)).toEqual([
      { nombre: "La mitad", texto: "20" },
      { nombre: "Todo", texto: "40" },
    ]);
  });

  it("redondea la mitad al céntimo", () => {
    expect(trozosDeDeuda(23.47).map((t) => t.texto)).toEqual(["11,73", "23,47"]);
  });

  it("quita los restos de decimales de la deuda", () => {
    expect(trozosDeDeuda(33.333333).map((t) => t.texto)).toEqual(["16,67", "33,33"]);
  });

  it("todo es la misma cifra que sale en pantalla", () => {
    // 23,47 entre dos: 11,735, que se enseña como 11.73 €.
    expect(trozosDeDeuda(23.47 / 2)[1].texto).toBe("11,73");
  });

  it("con un céntimo solo queda todo", () => {
    expect(trozosDeDeuda(0.01)).toEqual([{ nombre: "Todo", texto: "0,01" }]);
  });

  it("sin deuda no hay nada", () => {
    expect(trozosDeDeuda(0)).toEqual([]);
    expect(trozosDeDeuda(undefined)).toEqual([]);
  });

  it("lo que rellena se lee bien en el campo", () => {
    for (const t of trozosDeDeuda(23.47)) expect(leerImporte(t.texto)).not.toBeNull();
    expect(leerImporte(trozosDeDeuda(23.47)[0].texto)).toBe(11.73);
  });
});
