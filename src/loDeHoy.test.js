import { describe, it, expect } from "vitest";
import { gastadoHoy, frenteAAyer, textoFrenteAAyer } from "./loDeHoy";

const dia = "2026-10-14";

describe("gastadoHoy", () => {
  it("suma solo lo de hoy, y cuenta cuántos", () => {
    const gastos = [
      { fecha: "2026-10-13", importe: 100 },
      { fecha: dia, importe: 30 },
      { fecha: dia, importe: 15 },
    ];
    expect(gastadoHoy(gastos, dia)).toEqual({ total: 45, gastos: 2 });
  });

  it("en la moneda del viaje", () => {
    const gastos = [
      { fecha: "2026-10-13", importe: 10 },
      { fecha: dia, importe: 20, importeConvertido: 18.5 },
    ];
    expect(gastadoHoy(gastos, dia).total).toBe(18.5);
  });

  it("si hoy no hay nada, nada", () => {
    expect(gastadoHoy([{ fecha: "2026-10-13", importe: 10 }], dia)).toBeNull();
    expect(gastadoHoy([], dia)).toBeNull();
  });

  it("si todo es de hoy, ya lo dice el total", () => {
    expect(gastadoHoy([{ fecha: dia, importe: 10 }, { fecha: dia, importe: 5 }], dia)).toBeNull();
  });

  it("los de antes sin fecha no son de hoy", () => {
    expect(gastadoHoy([{ importe: 10 }, { fecha: dia, importe: 5 }], dia)).toEqual({ total: 5, gastos: 1 });
  });
});

describe("frenteAAyer", () => {
  const ayer = "2026-10-13";

  it("cuánto más que ayer", () => {
    const gastos = [
      { fecha: ayer, importe: 30 },
      { fecha: dia, importe: 40 },
      { fecha: dia, importe: 5 },
    ];
    expect(frenteAAyer(gastos, dia)).toBe(15);
  });

  it("o cuánto menos", () => {
    expect(frenteAAyer([{ fecha: ayer, importe: 50 }, { fecha: dia, importe: 20 }], dia)).toBe(-30);
  });

  it("sin restos de decimales", () => {
    expect(frenteAAyer([{ fecha: ayer, importe: 0.1 }, { fecha: dia, importe: 0.3 }], dia)).toBe(0.2);
  });

  it("en la moneda del viaje", () => {
    const gastos = [
      { fecha: ayer, importe: 10 },
      { fecha: dia, importe: 20, importeConvertido: 18.5 },
    ];
    expect(frenteAAyer(gastos, dia)).toBe(8.5);
  });

  it("si ayer no hubo nada, nada", () => {
    expect(frenteAAyer([{ fecha: "2026-10-12", importe: 10 }, { fecha: dia, importe: 5 }], dia)).toBeNull();
  });

  it("de un mes al anterior", () => {
    expect(frenteAAyer([{ fecha: "2026-09-30", importe: 10 }, { fecha: "2026-10-01", importe: 25 }], "2026-10-01")).toBe(15);
  });

  it("el día que cambia la hora", () => {
    expect(frenteAAyer([{ fecha: "2026-10-25", importe: 10 }, { fecha: "2026-10-26", importe: 12 }], "2026-10-26")).toBe(2);
  });
});

describe("textoFrenteAAyer", () => {
  it("más, menos o lo mismo", () => {
    expect(textoFrenteAAyer(15, "EUR")).toMatch(/^15\.00\s€ más que ayer$/);
    expect(textoFrenteAAyer(-30, "EUR")).toMatch(/^30\.00\s€ menos que ayer$/);
    expect(textoFrenteAAyer(0, "EUR")).toBe("lo mismo que ayer");
  });

  it("sin ayer, nada", () => {
    expect(textoFrenteAAyer(null, "EUR")).toBeNull();
  });
});
