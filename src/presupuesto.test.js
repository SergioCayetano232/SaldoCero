import { describe, it, expect } from "vitest";
import { estadoPresupuesto, textoPresupuesto, ritmoDeGasto, textoRitmo } from "./presupuesto";

describe("estadoPresupuesto", () => {
  it("sin presupuesto, nada", () => {
    expect(estadoPresupuesto(100, null)).toBeNull();
    expect(estadoPresupuesto(100, undefined)).toBeNull();
    expect(estadoPresupuesto(100, 0)).toBeNull();
  });

  it("lejos del tope, bien", () => {
    expect(estadoPresupuesto(430, 1000)).toEqual({
      porcentaje: 43,
      relleno: 0.43,
      queda: 570,
      nivel: "bien",
    });
  });

  it("del 80 % para arriba, cerca", () => {
    expect(estadoPresupuesto(799, 1000).nivel).toBe("bien");
    expect(estadoPresupuesto(800, 1000).nivel).toBe("cerca");
    expect(estadoPresupuesto(1000, 1000).nivel).toBe("cerca");
  });

  it("pasado, la barra se queda llena", () => {
    const estado = estadoPresupuesto(1030, 1000);
    expect(estado.nivel).toBe("pasado");
    expect(estado.relleno).toBe(1);
    expect(estado.porcentaje).toBe(103);
    expect(estado.queda).toBeCloseTo(-30);
  });

  it("un resto de decimales no es pasarse", () => {
    expect(estadoPresupuesto(100.004, 100).nivel).toBe("cerca");
  });

  it("sin gastar nada, todo por delante", () => {
    expect(estadoPresupuesto(0, 500)).toMatchObject({ porcentaje: 0, relleno: 0, nivel: "bien" });
  });
});

describe("textoPresupuesto", () => {
  it("lo que queda y de cuánto", () => {
    expect(textoPresupuesto(estadoPresupuesto(430, 1000), 1000, "EUR")).toBe(
      "Quedan 570.00 € de 1000.00 €"
    );
  });

  it("si os pasáis, cuánto", () => {
    expect(textoPresupuesto(estadoPresupuesto(1030, 1000), 1000, "EUR")).toBe(
      "Os pasáis 30.00 €"
    );
  });

  it("justo en el tope, quedan cero", () => {
    expect(textoPresupuesto(estadoPresupuesto(100.004, 100), 100, "USD")).toBe(
      "Quedan $0.00 de $100.00"
    );
  });
});

function gasto(fecha, importe, importeConvertido) {
  return { fecha, importe, importeConvertido };
}

describe("ritmoDeGasto", () => {
  it("sin gastos, no hay ritmo", () => {
    expect(ritmoDeGasto([])).toBeNull();
  });

  it("un solo día, la media es todo lo de ese día", () => {
    expect(ritmoDeGasto([gasto("2026-09-12", 40), gasto("2026-09-12", 50)])).toEqual({
      dias: 1,
      porDia: 90,
    });
  });

  it("cuenta del primer día al último, aunque en medio haya días sin nada", () => {
    const ritmo = ritmoDeGasto([gasto("2026-09-14", 100), gasto("2026-09-12", 50)]);
    expect(ritmo).toEqual({ dias: 3, porDia: 50 });
  });

  it("con lo convertido a la moneda del viaje, no con lo que se pagó", () => {
    expect(ritmoDeGasto([gasto("2026-09-12", 1000, 10)]).porDia).toBe(10);
  });

  it("el cambio de hora no le quita un día", () => {
    expect(ritmoDeGasto([gasto("2026-10-24", 10), gasto("2026-10-26", 20)]).dias).toBe(3);
  });

  it("los gastos sin fecha suman, pero no mueven los días", () => {
    expect(ritmoDeGasto([gasto("2026-09-12", 30), gasto(undefined, 30)])).toEqual({
      dias: 1,
      porDia: 60,
    });
  });
});

describe("textoRitmo", () => {
  const ritmo = { dias: 3, porDia: 45 };

  it("os dice para cuántos días os llega", () => {
    expect(textoRitmo(ritmo, estadoPresupuesto(135, 500), "EUR")).toBe(
      "45.00 € al día · os llega para 8 días más"
    );
  });

  it("un día, en singular", () => {
    expect(textoRitmo(ritmo, estadoPresupuesto(135, 200), "EUR")).toBe(
      "45.00 € al día · os llega para 1 día más"
    );
  });

  it("si no da ni para uno, lo avisa", () => {
    expect(textoRitmo(ritmo, estadoPresupuesto(135, 150), "EUR")).toBe(
      "45.00 € al día · no os llega para otro día"
    );
  });

  it("pasados del presupuesto, solo la media", () => {
    expect(textoRitmo(ritmo, estadoPresupuesto(600, 500), "EUR")).toBe("45.00 € al día");
  });

  it("con el viaje cerrado ya no hay días por delante", () => {
    expect(textoRitmo(ritmo, estadoPresupuesto(135, 500), "EUR", true)).toBe("45.00 € al día");
  });

  it("respeta la moneda del viaje", () => {
    expect(textoRitmo(ritmo, null, "GBP")).toBe("£45.00 al día");
  });
});
