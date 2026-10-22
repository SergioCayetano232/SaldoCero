import { describe, it, expect } from "vitest";
import { estaCerrado, textoCerrado, avisoAlCerrar, ultimoApunte, sugerirCerrar } from "./cerrar";
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

describe("ultimoApunte", () => {
  it("el que se apuntó más tarde, aunque sea de un día anterior", () => {
    const gastos = [
      { fecha: "2026-10-10", creadoEn: "2026-10-10T20:00:00Z" },
      { fecha: "2026-10-09", creadoEn: "2026-10-13T09:00:00Z" },
    ];
    expect(ultimoApunte(gastos)).toBe("2026-10-13T09:00:00Z");
  });

  it("los de antes sin creadoEn, por su fecha", () => {
    expect(ultimoApunte([{ fecha: "2026-10-10" }])).toBe("2026-10-10");
  });

  it("sin gastos, nada", () => {
    expect(ultimoApunte([])).toBeNull();
  });
});

describe("sugerirCerrar", () => {
  const ahora = new Date("2026-10-20T12:00:00Z").getTime();
  const gastos = [{ creadoEn: "2026-10-16T10:00:00Z" }];

  it("los días que lleva sin apuntarse nada", () => {
    expect(sugerirCerrar({ gastos, cerrado: false, ahora })).toBe(4);
  });

  it("con menos de tres días, aún no", () => {
    expect(sugerirCerrar({ gastos: [{ creadoEn: "2026-10-18T10:00:00Z" }], cerrado: false, ahora })).toBeNull();
  });

  it("justo tres días, sí", () => {
    expect(sugerirCerrar({ gastos: [{ creadoEn: "2026-10-17T12:00:00Z" }], cerrado: false, ahora })).toBe(3);
  });

  it("cerrado ya, nada", () => {
    expect(sugerirCerrar({ gastos, cerrado: true, ahora })).toBeNull();
  });

  it("sin gastos, nada", () => {
    expect(sugerirCerrar({ gastos: [], cerrado: false, ahora })).toBeNull();
  });

  it("si dijiste que aún no, no insiste", () => {
    expect(sugerirCerrar({ gastos, cerrado: false, descartado: "2026-10-16T10:00:00Z", ahora })).toBeNull();
  });

  it("pero si luego se apunta algo y vuelve a pararse, sí", () => {
    const mas = [...gastos, { creadoEn: "2026-10-16T22:00:00Z" }];
    expect(sugerirCerrar({ gastos: mas, cerrado: false, descartado: "2026-10-16T10:00:00Z", ahora })).toBe(3);
  });
});
