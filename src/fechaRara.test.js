import { describe, it, expect } from "vitest";
import { fechaRara, fechaConAno } from "./fechaRara";

const viaje = [{ fecha: "2026-08-10" }, { fecha: "2026-08-12" }, { fecha: "2026-08-14" }];
const HOY = "2026-10-12";

describe("fechaRara", () => {
  it("pilla el año pasado", () => {
    expect(fechaRara("2025-08-12", viaje, HOY)).toBe(true);
  });

  it("los días del viaje y los de alrededor no extrañan", () => {
    expect(fechaRara("2026-08-11", viaje, HOY)).toBe(false);
    expect(fechaRara("2026-08-30", viaje, HOY)).toBe(false);
    expect(fechaRara("2026-07-15", viaje, HOY)).toBe(false);
  });

  it("a más de un mes del gasto más cercano, sí", () => {
    expect(fechaRara("2026-09-13", viaje, HOY)).toBe(false);
    expect(fechaRara("2026-09-14", viaje, HOY)).toBe(true);
    expect(fechaRara("2026-06-01", viaje, HOY)).toBe(true);
  });

  it("sin gastos se compara con hoy, con más margen", () => {
    expect(fechaRara("2026-09-01", [], HOY)).toBe(false);
    expect(fechaRara("2026-08-01", [], HOY)).toBe(true);
  });

  it("los gastos sin fecha no cuentan", () => {
    expect(fechaRara("2026-10-10", [{ fecha: null }, {}], HOY)).toBe(false);
    expect(fechaRara("2025-10-10", [{ fecha: null }], HOY)).toBe(true);
  });

  it("sin fecha no hay nada que preguntar", () => {
    expect(fechaRara("", viaje, HOY)).toBe(false);
  });
});

describe("fechaConAno", () => {
  it("con el año entero", () => {
    expect(fechaConAno("2025-08-12")).toBe("12 de agosto de 2025");
  });
});
