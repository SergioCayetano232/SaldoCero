import { describe, it, expect } from "vitest";
import { gastadoHoy } from "./loDeHoy";

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
