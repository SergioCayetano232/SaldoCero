import { describe, it, expect } from "vitest";
import { diasSinGastos, textoHuecos, MAXIMO_DIAS } from "./huecos";
import { enCorto } from "./fechas";

const gasto = (fecha) => ({ fecha, importe: 10 });

describe("diasSinGastos", () => {
  it("saca los días del medio que no tienen nada", () => {
    const gastos = [gasto("2026-10-10"), gasto("2026-10-13"), gasto("2026-10-11")];
    expect(diasSinGastos(gastos)).toEqual(["2026-10-12"]);
  });

  it("sin huecos, nada", () => {
    expect(diasSinGastos([gasto("2026-10-10"), gasto("2026-10-11")])).toEqual([]);
  });

  it("con un solo día no hay viaje que mirar", () => {
    expect(diasSinGastos([gasto("2026-10-10"), gasto("2026-10-10")])).toEqual([]);
    expect(diasSinGastos([])).toEqual([]);
  });

  it("los gastos de antes, sin fecha, no cuentan", () => {
    expect(diasSinGastos([gasto(null), gasto("2026-10-10"), gasto("2026-10-12")])).toEqual(["2026-10-11"]);
  });

  it("se salta los días que ya dijiste que no gastasteis", () => {
    const gastos = [gasto("2026-10-10"), gasto("2026-10-14")];
    expect(diasSinGastos(gastos, ["2026-10-12"])).toEqual(["2026-10-11", "2026-10-13"]);
  });

  it("pasa bien por el cambio de hora", () => {
    expect(diasSinGastos([gasto("2026-10-24"), gasto("2026-10-27")])).toEqual(["2026-10-25", "2026-10-26"]);
  });

  it("y cambia de mes", () => {
    expect(diasSinGastos([gasto("2026-09-30"), gasto("2026-10-02")])).toEqual(["2026-10-01"]);
  });

  it("si el viaje dura demasiado, es una fecha mal puesta y no avisa", () => {
    const desde = new Date(Date.UTC(2026, 0, 1));
    const hasta = new Date(desde.getTime() + MAXIMO_DIAS * 86400000);
    expect(diasSinGastos([gasto("2026-01-01"), gasto(hasta.toISOString().slice(0, 10))])).toEqual([]);
  });

  it("justo en el tope todavía avisa", () => {
    const hasta = new Date(Date.UTC(2026, 0, MAXIMO_DIAS)).toISOString().slice(0, 10);
    expect(diasSinGastos([gasto("2026-01-01"), gasto(hasta)])).toHaveLength(MAXIMO_DIAS - 2);
  });
});

describe("textoHuecos", () => {
  it("sin huecos, nada que decir", () => {
    expect(textoHuecos([])).toBeNull();
  });

  it("un día", () => {
    expect(textoHuecos(["2026-10-12"])).toBe(`El ${enCorto("2026-10-12")} no hay nada apuntado.`);
  });

  it("dos días, con y", () => {
    expect(textoHuecos(["2026-10-12", "2026-10-14"])).toBe(
      `El ${enCorto("2026-10-12")} y el ${enCorto("2026-10-14")} no hay nada apuntado.`
    );
  });

  it("tres, todavía uno a uno", () => {
    expect(textoHuecos(["2026-10-12", "2026-10-14", "2026-10-16"])).toBe(
      `El ${enCorto("2026-10-12")}, el ${enCorto("2026-10-14")} y el ${enCorto("2026-10-16")} no hay nada apuntado.`
    );
  });

  it("más de tres, los cuenta y dice el primero", () => {
    expect(textoHuecos(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"])).toBe(
      `Hay 4 días sin nada apuntado, el primero el ${enCorto("2026-10-12")}.`
    );
  });
});
