import { describe, it, expect } from "vitest";
import { miSaldo, textoMiSaldo, estadoMiSaldo } from "./miSaldo";

const pagos = [
  { deId: "b", aId: "a", cantidad: 30, saldado: false },
  { deId: "c", aId: "a", cantidad: 15, saldado: false },
  { deId: "d", aId: "e", cantidad: 20, saldado: false },
];

describe("miSaldo", () => {
  it("sin saber quién eres no hay nada que decir", () => {
    expect(miSaldo(pagos, null)).toBeNull();
    expect(textoMiSaldo(null, "EUR")).toBeNull();
  });

  it("suma lo que te deben todos", () => {
    const saldo = miSaldo(pagos, "a");
    expect(saldo).toEqual({ debes: 0, teDeben: 45, tenias: true });
    expect(textoMiSaldo(saldo, "EUR")).toBe("Te deben 45.00 €");
    expect(estadoMiSaldo(saldo)).toBe("le-deben");
  });

  it("lo que debes tú", () => {
    const saldo = miSaldo(pagos, "b");
    expect(textoMiSaldo(saldo, "USD")).toBe("Debes $30.00");
    expect(estadoMiSaldo(saldo)).toBe("debe");
  });

  it("lo ya pagado no cuenta", () => {
    const conUnoPagado = pagos.map((p) => (p.deId === "b" ? { ...p, saldado: true } : p));
    expect(textoMiSaldo(miSaldo(conUnoPagado, "a"), "EUR")).toBe("Te deben 15.00 €");
    expect(textoMiSaldo(miSaldo(conUnoPagado, "b"), "EUR")).toBe("Lo tuyo ya está pagado");
    expect(estadoMiSaldo(miSaldo(conUnoPagado, "b"))).toBe("en-paz");
  });

  it("si no sales en ningún pago, estás en paz", () => {
    expect(textoMiSaldo(miSaldo(pagos, "z"), "EUR")).toBe("Estás en paz");
    expect(textoMiSaldo(miSaldo([], "a"), "EUR")).toBe("Estás en paz");
  });

  it("debiendo y cobrando a la vez, las dos cosas", () => {
    const cruzados = [
      { deId: "a", aId: "b", cantidad: 10, saldado: false },
      { deId: "c", aId: "a", cantidad: 25, saldado: false },
    ];
    const saldo = miSaldo(cruzados, "a");
    expect(textoMiSaldo(saldo, "EUR")).toBe("Debes 10.00 € y te deben 25.00 €");
    expect(estadoMiSaldo(saldo)).toBe("le-deben");
  });
});
