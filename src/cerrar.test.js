import { describe, it, expect } from "vitest";
import { estaCerrado, textoCerrado, avisoAlCerrar } from "./cerrar";
import { enCorto } from "./fechas";

describe("estaCerrado", () => {
  it("con fecha de cierre, cerrado", () => {
    expect(estaCerrado({ cerradoEn: "2026-09-30T18:00:00Z" })).toBe(true);
  });

  it("sin ella, o de los de antes, abierto", () => {
    expect(estaCerrado({ cerradoEn: null })).toBe(false);
    expect(estaCerrado({ nombre: "Viejo" })).toBe(false);
    expect(estaCerrado(null)).toBe(false);
  });
});

describe("textoCerrado", () => {
  it("dice el día en corto", () => {
    expect(textoCerrado("2026-09-11T12:00:00")).toBe(`Cerrado el ${enCorto("2026-09-11")}`);
  });

  it("el día es el de aquí, no el de Greenwich", () => {
    const cierre = new Date(2026, 8, 11, 23, 30);
    expect(textoCerrado(cierre.toISOString())).toBe(`Cerrado el ${enCorto("2026-09-11")}`);
  });
});

describe("avisoAlCerrar", () => {
  const pago = (cantidad, saldado = false) => ({ deId: "a", aId: "b", cantidad, saldado });

  it("con todo pagado, solo la pregunta", () => {
    const texto = avisoAlCerrar("Lisboa", [pago(30, true)]);
    expect(texto).toContain('¿Cerrar "Lisboa"?');
    expect(texto).not.toContain("Ojo");
  });

  it("sin deudas, también", () => {
    expect(avisoAlCerrar("Lisboa", [])).not.toContain("Ojo");
  });

  it("si quedan, dice cuántos y cuánto, sin contar los pagados", () => {
    const texto = avisoAlCerrar("Lisboa", [pago(30), pago(15.5), pago(100, true)]);
    expect(texto).toContain("aún quedan 2 pagos sin hacer (45.50 €)");
  });

  it("uno solo, en singular y en la moneda del viaje", () => {
    expect(avisoAlCerrar("Londres", [pago(20)], "GBP")).toContain("aún queda 1 pago sin hacer (£20.00)");
  });
});
