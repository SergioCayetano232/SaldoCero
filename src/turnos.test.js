import { describe, it, expect } from "vitest";
import { turnos } from "./turnos";

describe("turnos", () => {
  it("en orden, todas valen", () => {
    const t = turnos();
    expect(t.vale(t.pedir())).toBe(true);
    expect(t.vale(t.pedir())).toBe(true);
  });

  it("la que sale antes y llega después no pisa a la nueva", () => {
    const t = turnos();
    const escucha = t.pedir();
    const trasAnadir = t.pedir();

    expect(t.vale(trasAnadir)).toBe(true);
    expect(t.vale(escucha)).toBe(false);
  });

  it("si la vieja llega primero, vale hasta que llegue la nueva", () => {
    const t = turnos();
    const escucha = t.pedir();
    const trasAnadir = t.pedir();

    expect(t.vale(escucha)).toBe(true);
    expect(t.vale(trasAnadir)).toBe(true);
  });

  it("cada viaje lleva su cuenta", () => {
    const uno = turnos();
    const otro = turnos();
    uno.vale(uno.pedir());
    uno.vale(uno.pedir());

    expect(otro.vale(otro.pedir())).toBe(true);
  });
});
