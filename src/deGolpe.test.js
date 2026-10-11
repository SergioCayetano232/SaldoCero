import { describe, it, expect } from "vitest";
import { deudoresConVarias } from "./deGolpe";
import { BOTE } from "./bote";

const pago = (deId, aId, cantidad, saldado = false) => ({
  deId,
  aId,
  de: deId.toUpperCase(),
  a: aId === BOTE ? "Bote" : aId.toUpperCase(),
  cantidad,
  saldado,
});

describe("deudoresConVarias", () => {
  it("junta lo que debe uno a varios", () => {
    const pagos = [pago("luis", "ana", 30), pago("luis", "marta", 15), pago("pablo", "ana", 10)];
    const [luis] = deudoresConVarias(pagos);
    expect(luis.deId).toBe("luis");
    expect(luis.cantidad).toBe(45);
    expect(luis.pagos).toHaveLength(2);
  });

  it("con una deuda sola no sale", () => {
    expect(deudoresConVarias([pago("luis", "ana", 30), pago("pablo", "marta", 10)])).toEqual([]);
  });

  it("lo ya pagado no cuenta", () => {
    const pagos = [pago("luis", "ana", 30), pago("luis", "marta", 15, true)];
    expect(deudoresConVarias(pagos)).toEqual([]);
  });

  it("con tres pendientes y uno pagado, solo los pendientes", () => {
    const pagos = [pago("luis", "ana", 30), pago("luis", "marta", 15, true), pago("luis", "pablo", 5)];
    const [luis] = deudoresConVarias(pagos);
    expect(luis.cantidad).toBe(35);
    expect(luis.pagos.map((p) => p.aId)).toEqual(["ana", "pablo"]);
  });

  it("el bote no, aunque devuelva a varios", () => {
    const pagos = [pago(BOTE, "ana", 30), pago(BOTE, "marta", 15)];
    expect(deudoresConVarias(pagos)).toEqual([]);
  });

  it("pagarle al bote también cuenta como deuda", () => {
    const pagos = [pago("luis", BOTE, 20), pago("luis", "ana", 10)];
    expect(deudoresConVarias(pagos)[0].cantidad).toBe(30);
  });

  it("los marcados antes de los ids van por nombre", () => {
    const pagos = [
      { de: "Luis", a: "Ana", cantidad: 30, saldado: false },
      { de: "Luis", a: "Marta", cantidad: 15, saldado: false },
    ];
    expect(deudoresConVarias(pagos)[0].cantidad).toBe(45);
  });
});
