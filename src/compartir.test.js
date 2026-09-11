import { describe, it, expect } from "vitest";
import { resumenEnTexto } from "./compartir";

// Un viaje de ejemplo, para no repetirlo en cada prueba.
const viaje = {
  nombre: "Lisboa",
  codigo: "ABC12345",
  total: 326.5,
  moneda: "EUR",
  balances: [
    { id: "a", nombre: "Ana", puesto: 240, tocaPagar: 108.83, balance: 131.17 },
    { id: "b", nombre: "Luis", puesto: 86.5, tocaPagar: 108.83, balance: -22.33 },
    { id: "c", nombre: "Marta", puesto: 0, tocaPagar: 108.83, balance: -108.83 },
  ],
  pagos: [
    { de: "Marta", a: "Ana", cantidad: 108.83, saldado: false },
    { de: "Luis", a: "Ana", cantidad: 22.33, saldado: false },
  ],
};

describe("resumenEnTexto", () => {
  it("lleva el nombre y el total", () => {
    const texto = resumenEnTexto(viaje);

    expect(texto).toContain("Lisboa");
    expect(texto).toContain("326.50 €");
  });

  it("lista lo que puso cada uno", () => {
    const texto = resumenEnTexto(viaje);

    expect(texto).toContain("Ana: 240.00 €");
    expect(texto).toContain("Luis: 86.50 €");
    expect(texto).toContain("Marta: 0.00 €");
  });

  it("dice quién le paga a quién", () => {
    const texto = resumenEnTexto(viaje);

    expect(texto).toContain("Marta → Ana");
    expect(texto).toContain("Luis → Ana");
  });

  it("lleva el código para que puedan entrar", () => {
    expect(resumenEnTexto(viaje)).toContain("ABC12345");
  });

  it("respeta la moneda del viaje", () => {
    const texto = resumenEnTexto({ ...viaje, moneda: "GBP" });
    expect(texto).toContain("£326.50");
  });

  it("si no hay deudas, lo dice y ya", () => {
    const texto = resumenEnTexto({ ...viaje, pagos: [] });

    expect(texto).toContain("Cuentas saldadas");
    expect(texto).not.toContain("Quién le paga a quién");
  });

  it("los pagos ya hechos no salen como pendientes", () => {
    const texto = resumenEnTexto({
      ...viaje,
      pagos: [
        { de: "Marta", a: "Ana", cantidad: 108.83, saldado: true },
        { de: "Luis", a: "Ana", cantidad: 22.33, saldado: false },
      ],
    });

    // El pendiente, en la lista de arriba con su importe.
    expect(texto).toContain("· Luis → Ana: *22.33 €*");
    // Y el ya pagado, apartado abajo.
    expect(texto).toContain("Ya pagado: Marta → Ana");
  });

  it("si está todo pagado, no pide pagar nada", () => {
    const texto = resumenEnTexto({
      ...viaje,
      pagos: viaje.pagos.map((p) => ({ ...p, saldado: true })),
    });

    expect(texto).toContain("Todo pagado");
    expect(texto).not.toContain("Quién le paga a quién");
  });
});
