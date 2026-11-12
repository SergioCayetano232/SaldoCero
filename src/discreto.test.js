import { describe, it, expect, afterEach, vi } from "vitest";
import { estaDiscreto, ponerDiscreto, alCambiarDiscreto } from "./discreto";
import { conMoneda, conMonedaDeVerdad } from "./monedas";
import { resumenEnTexto } from "./compartir";
import { mensajeDeCobro } from "./cobrar";
import { mensajeDeGasto } from "./avisarGasto";
import { datosDeTarjeta } from "./tarjeta";
import { textoCuentaDe, mensajeDeCuenta } from "./loDeUno";

afterEach(() => ponerDiscreto(false));

describe("modo discreto", () => {
  it("empieza quitado", () => {
    expect(estaDiscreto()).toBe(false);
    expect(conMoneda(12.5)).toBe("12.50 €");
  });

  it("tapa la cifra y deja la moneda donde va", () => {
    ponerDiscreto(true);
    expect(conMoneda(12.5)).toBe("•••• €");
    expect(conMoneda(400, "USD")).toBe("$••••");
    expect(conMoneda(3, "CHF")).toBe("•••• CHF");
  });

  it("no deja ver ni el signo ni lo largo que es", () => {
    ponerDiscreto(true);
    expect(conMoneda(-22.33)).toBe(conMoneda(1234567));
  });

  it("al quitarlo vuelven las cifras", () => {
    ponerDiscreto(true);
    ponerDiscreto(false);
    expect(conMoneda(12.5)).toBe("12.50 €");
  });

  it("avisa al cambiar, y solo si cambia", () => {
    const fn = vi.fn();
    const dejar = alCambiarDiscreto(fn);
    ponerDiscreto(true);
    ponerDiscreto(true);
    expect(fn).toHaveBeenCalledTimes(1);
    dejar();
    ponerDiscreto(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("lo de la pantalla sale tapado", () => {
    ponerDiscreto(true);
    expect(textoCuentaDe({ pagado: 120, leToca: 80 }, "Ana", true, "EUR")).toBe("Pagaste •••• € · te tocan •••• €");
  });
});

// Lo que mandas a otro lleva las cifras: el que lo recibe no tiene nada tapado.
describe("lo que sale de la app, con el modo discreto puesto", () => {
  it("conMonedaDeVerdad no tapa nunca", () => {
    ponerDiscreto(true);
    expect(conMonedaDeVerdad(-400, "USD")).toBe("-$400.00");
    expect(conMonedaDeVerdad(12.5)).toBe("12.50 €");
  });

  it("el resumen en texto", () => {
    ponerDiscreto(true);
    const texto = resumenEnTexto({
      nombre: "Lisboa",
      codigo: "ABC12345",
      total: 90,
      moneda: "EUR",
      balances: [
        { id: "a", nombre: "Ana", puesto: 90, tocaPagar: 45, balance: 45 },
        { id: "b", nombre: "Luis", puesto: 0, tocaPagar: 45, balance: -45 },
      ],
      pagos: [{ de: "Luis", a: "Ana", cantidad: 45, saldado: false }],
    });
    expect(texto).toContain("90.00 €");
    expect(texto).toContain("45.00 €");
    expect(texto).not.toContain("••••");
  });

  it("el WhatsApp para cobrar", () => {
    ponerDiscreto(true);
    const texto = mensajeDeCobro({ pago: { de: "Marta", a: "Ana", cantidad: 108.83 }, nombreViaje: "Lisboa", codigo: "ABC12345", moneda: "EUR", base: "https://saldocero.app/" });
    expect(texto).toContain("108.83 €");
    expect(texto).not.toContain("••••");
  });

  it("el aviso de un gasto", () => {
    ponerDiscreto(true);
    const viajeros = [{ id: "a", nombre: "Ana" }, { id: "b", nombre: "Luis" }];
    const texto = mensajeDeGasto({ gasto: { concepto: "Cena", importe: 60, pagadoPor: "a", categoria: "comida" }, viajeros, moneda: "EUR" });
    expect(texto).toContain("60.00 €");
    expect(texto).not.toContain("••••");
  });

  it("las cuentas de uno", () => {
    ponerDiscreto(true);
    const viajeros = [{ id: "a", nombre: "Ana" }, { id: "b", nombre: "Luis" }];
    const gastos = [{ concepto: "Cena", importe: 90, pagadoPor: "a" }];
    const texto = mensajeDeCuenta({ gastos, viajero: viajeros[1], viajeros, esYo: false, nombreViaje: "Lisboa", moneda: "EUR" });
    expect(texto).toContain("90.00 €");
    expect(texto).not.toContain("••••");
  });

  it("la imagen del resumen", () => {
    ponerDiscreto(true);
    const tarjeta = datosDeTarjeta({
      nombre: "Lisboa",
      total: 90,
      moneda: "EUR",
      personas: [{ id: "a", nombre: "Ana" }, { id: "b", nombre: "Luis" }],
      pagos: [{ de: "Luis", a: "Ana", cantidad: 45, saldado: false }],
      gastos: [{ concepto: "Cena", importe: 90 }],
    });
    expect(JSON.stringify(tarjeta)).not.toContain("••••");
    expect(tarjeta.total).toBe("90.00 €");
  });
});
