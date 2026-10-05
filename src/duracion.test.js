import { describe, it, expect } from "vitest";
import { textoDuracion } from "./duracion";

const conFechas = (...fechas) => fechas.map((fecha) => ({ fecha }));

describe("textoDuracion", () => {
  it("sin gastos con fecha, nada", () => {
    expect(textoDuracion([], "2026-10-05")).toBeNull();
    expect(textoDuracion([{ fecha: null }], "2026-10-05")).toBeNull();
  });

  it("el primer día es el día 1", () => {
    expect(textoDuracion(conFechas("2026-10-05"), "2026-10-05")).toBe("Día 1");
  });

  it("cuenta desde el primer gasto, vengan en el orden que vengan", () => {
    expect(textoDuracion(conFechas("2026-10-04", "2026-10-03", "2026-10-05"), "2026-10-05")).toBe("Día 3");
  });

  it("un día sin gastos también cuenta", () => {
    expect(textoDuracion(conFechas("2026-10-03"), "2026-10-05")).toBe("Día 3");
  });

  it("cerrado, lo que duró", () => {
    expect(textoDuracion(conFechas("2026-10-01", "2026-10-05"), "2026-10-20", true)).toBe("5 días");
    expect(textoDuracion(conFechas("2026-10-05"), "2026-10-05", true)).toBe("1 día");
  });

  it("sin cerrar pero sin gastos hace días, también lo que duró", () => {
    expect(textoDuracion(conFechas("2026-09-01", "2026-09-04"), "2026-10-05")).toBe("4 días");
  });

  it("dos días sin gastos aún es viaje", () => {
    expect(textoDuracion(conFechas("2026-10-01", "2026-10-03"), "2026-10-05")).toBe("Día 5");
  });

  it("el cambio de hora no descuenta un día", () => {
    expect(textoDuracion(conFechas("2026-10-24", "2026-10-26"), "2026-10-26")).toBe("Día 3");
    expect(textoDuracion(conFechas("2026-03-28", "2026-03-30"), "2026-03-30", true)).toBe("3 días");
  });

  it("un gasto de mañana no da el día 0", () => {
    expect(textoDuracion(conFechas("2026-10-06"), "2026-10-05")).toBe("Día 1");
  });
});
