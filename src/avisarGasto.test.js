import { describe, it, expect } from "vitest";
import { mensajeDeGasto } from "./avisarGasto";
import { BOTE } from "./bote";

const viajeros = [
  { id: "a", nombre: "Ana" },
  { id: "b", nombre: "Luis" },
  { id: "c", nombre: "Marta" },
  { id: "d", nombre: "Pepe" },
];
const base = "https://saldo.app/";

describe("mensajeDeGasto", () => {
  it("entre todos, con lo que sale cada uno y el enlace", () => {
    const gasto = { pagadorId: "a", importe: 60, concepto: "Cena", categoria: "comida" };
    expect(mensajeDeGasto({ gasto, viajeros, moneda: "EUR", codigo: "ABCD1234", base })).toBe(
      [
        "🍽️ *Cena*: 60.00 €, pagó Ana",
        "Sale a *15.00 €* cada uno, entre todos",
        "",
        "Las cuentas, aquí: https://saldo.app/#ABCD1234",
      ].join("\n")
    );
  });

  it("solo entre algunos, los nombra", () => {
    const gasto = { pagadorId: "b", importe: 30, concepto: "Taxi", categoria: "transporte", participantes: ["a", "b", "c"] };
    const texto = mensajeDeGasto({ gasto, viajeros, moneda: "EUR" });
    expect(texto).toContain("Sale a *10.00 €* cada uno, entre Ana, Luis y Marta");
    expect(texto).not.toContain("Las cuentas");
  });

  it("a partes distintas, lo de cada uno", () => {
    const gasto = {
      pagadorId: "a",
      importe: 30,
      concepto: "Chuletón",
      participantes: ["a", "b"],
      partes: { a: 2, b: 1 },
    };
    const texto = mensajeDeGasto({ gasto, viajeros, moneda: "EUR" });
    expect(texto).toContain("· Ana: 20.00 €");
    expect(texto).toContain("· Luis: 10.00 €");
    expect(texto).not.toContain("cada uno");
  });

  it("en otra moneda salen las dos cifras", () => {
    const gasto = { pagadorId: "a", importe: 100, moneda: "USD", importeConvertido: 92, concepto: "Museo", categoria: "ocio" };
    expect(mensajeDeGasto({ gasto, viajeros, moneda: "EUR" })).toContain("*Museo*: $100.00 (92.00 €)");
  });

  it("del bote y con nota", () => {
    const gasto = { pagadorId: BOTE, importe: 40, concepto: "Súper", nota: "incluye el agua" };
    const texto = mensajeDeGasto({ gasto, viajeros, moneda: "EUR" });
    expect(texto).toContain("*Súper*: 40.00 €, del bote");
    expect(texto).toContain("_incluye el agua_");
  });

  it("de uno solo no hay reparto que contar", () => {
    const gasto = { pagadorId: "a", importe: 12, concepto: "Souvenir", participantes: ["a"] };
    expect(mensajeDeGasto({ gasto, viajeros, moneda: "EUR" }).split("\n")).toHaveLength(1);
  });
});
