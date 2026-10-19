import { describe, it, expect } from "vitest";
import { cuentaDe, textoCuentaDe, textoParteDe, mensajeDeCuenta } from "./loDeUno";
import { enCorto } from "./fechas";
import { BOTE } from "./bote";

const viajeros = [{ id: "a" }, { id: "b" }, { id: "c" }];

const gastos = [
  // 90 entre los tres.
  { pagadorId: "a", importe: 90, participantes: ["a", "b", "c"] },
  // 40 entre Luis y Marta, lo pagó Ana sin ir.
  { pagadorId: "a", importe: 40, participantes: ["b", "c"] },
  // 30 a partes 2 y 1 entre Ana y Luis.
  { pagadorId: "b", importe: 30, participantes: ["a", "b"], partes: { a: 2, b: 1 } },
  // Del bote, entre todos.
  { pagadorId: BOTE, importe: 60 },
];

describe("cuentaDe", () => {
  it("lo que pagó y lo que le tocaba", () => {
    const ana = cuentaDe(gastos, "a", viajeros);
    expect(ana.pagado).toBe(130);
    // 30 + 0 + 20 + 20
    expect(ana.leToca).toBeCloseTo(70);
  });

  it("el que no pagó nada", () => {
    const marta = cuentaDe(gastos, "c", viajeros);
    expect(marta.pagado).toBe(0);
    expect(marta.leToca).toBeCloseTo(30 + 20 + 20);
  });

  it("en otra moneda, lo convertido", () => {
    const cena = [{ pagadorId: "a", importe: 300, importeConvertido: 27.75, participantes: ["a"] }];
    expect(cuentaDe(cena, "a", viajeros)).toEqual({ pagado: 27.75, leToca: 27.75 });
  });

  it("sin gastos, ceros", () => {
    expect(cuentaDe([], "a", viajeros)).toEqual({ pagado: 0, leToca: 0 });
  });
});

describe("textoCuentaDe", () => {
  const cuenta = { pagado: 130, leToca: 70 };

  it("si eres tú, de tú", () => {
    expect(textoCuentaDe(cuenta, "Ana", true, "EUR")).toBe("Pagaste 130.00 € · te tocan 70.00 €");
  });

  it("si es otro, con su nombre", () => {
    expect(textoCuentaDe(cuenta, "Ana", false, "EUR")).toBe("Ana pagó 130.00 € · le tocan 70.00 €");
  });
});

describe("textoParteDe", () => {
  it("lo que le toca de ese gasto", () => {
    expect(textoParteDe(gastos[0], "a", viajeros, true, "EUR")).toBe("te tocan 30.00 €");
    expect(textoParteDe(gastos[2], "a", viajeros, false, "EUR")).toBe("le tocan 20.00 €");
  });

  it("si lo pagó sin ir, lo dice", () => {
    expect(textoParteDe(gastos[1], "a", viajeros, true, "EUR")).toBe("lo pagaste, no ibas");
    expect(textoParteDe(gastos[1], "a", viajeros, false, "EUR")).toBe("lo pagó, no iba");
  });
});

describe("mensajeDeCuenta", () => {
  const gente = [{ id: "a", nombre: "Ana" }, { id: "b", nombre: "Luis" }, { id: "c", nombre: "Marta" }];
  const delViaje = [
    { pagadorId: "a", importe: 90, concepto: "Cena", fecha: "2026-10-17", participantes: ["a", "b", "c"] },
    { pagadorId: "a", importe: 40, concepto: "Taxi", fecha: "2026-10-18", participantes: ["b", "c"] },
    { pagadorId: "c", importe: 20, concepto: "Helados", fecha: "2026-10-18", participantes: ["c"] },
  ];
  const datos = { gastos: delViaje, viajeros: gente, nombreViaje: "Lisboa", moneda: "EUR", codigo: "ABC12345", base: "https://saldocero.app/" };

  it("a otro, en segunda persona y con cada gasto suyo", () => {
    const texto = mensajeDeCuenta({ ...datos, viajero: gente[1], esYo: false });
    expect(texto).toContain("Hola Luis! Tus cuentas de *Lisboa*");
    expect(texto).toContain(`· Cena, ${enCorto("2026-10-17")} (90.00 €): te tocan 30.00 €`);
    expect(texto).toContain(`· Taxi, ${enCorto("2026-10-18")} (40.00 €): te tocan 20.00 €`);
    expect(texto).toContain("En total pagaste *0.00 €* y te tocan *50.00 €*");
  });

  it("los gastos que no van con él no salen", () => {
    expect(mensajeDeCuenta({ ...datos, viajero: gente[1], esYo: false })).not.toContain("Helados");
  });

  it("lo que pagó sin ir, y lo que pagó yendo", () => {
    const texto = mensajeDeCuenta({ ...datos, viajero: gente[0], esYo: false });
    expect(texto).toContain("(40.00 €): lo pagaste, no ibas");
    expect(texto).toContain("(90.00 €): lo pagaste, te tocan 30.00 €");
    expect(texto).toContain("En total pagaste *130.00 €* y te tocan *30.00 €*");
  });

  it("si eres tú, en primera persona", () => {
    const texto = mensajeDeCuenta({ ...datos, viajero: gente[0], esYo: true });
    expect(texto).toContain("Mis cuentas de *Lisboa*");
    expect(texto).toContain("lo pagué, no iba");
    expect(texto).toContain("En total pagué *130.00 €* y me tocan *30.00 €*");
  });

  it("con el enlace al final, y sin fecha si no la tiene", () => {
    const sinFecha = [{ ...delViaje[0], fecha: null }];
    const texto = mensajeDeCuenta({ ...datos, gastos: sinFecha, viajero: gente[1], esYo: false });
    expect(texto).toContain("· Cena (90.00 €): te tocan 30.00 €");
    expect(texto.split("\n").at(-1)).toBe("Las cuentas, aquí: https://saldocero.app/#ABC12345");
  });
});
