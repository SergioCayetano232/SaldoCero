import { describe, it, expect } from "vitest";
import { mensajeDeCobro, enlaceWhatsApp } from "./cobrar";

const pago = { de: "Marta", a: "Ana", deId: "m", aId: "a", cantidad: 108.83 };
const base = "https://saldocero.app/";

function mensaje(extra = {}) {
  return mensajeDeCobro({ pago, nombreViaje: "Lisboa", codigo: "ABC12345", moneda: "EUR", base, ...extra });
}

describe("mensajeDeCobro", () => {
  it("si sabemos el Bizum de quien cobra, va en el mensaje", () => {
    const cobro = { tipo: "bizum", valor: "612345678" };
    expect(mensaje({ cobro })).toContain("Bizum a Ana: 612 345 678");
    expect(mensaje({ cobro, soy: "a" })).toContain("Mi Bizum: 612 345 678");
  });

  it("sin Bizum ni IBAN, el mensaje de siempre", () => {
    expect(mensaje()).not.toContain("Bizum");
  });

  it("si cobras tú, va en primera persona", () => {
    const texto = mensaje({ soy: "a" });

    expect(texto).toContain("Hola Marta!");
    expect(texto).toContain("me debes *108.83 €*");
    expect(texto).not.toContain("a Ana");
  });

  it("si no eres tú quien cobra, dice a quién hay que pagarle", () => {
    expect(mensaje({ soy: null })).toContain("te toca pagarle *108.83 €* a Ana");
  });

  it("siendo el que debe, tampoco dice me debes", () => {
    expect(mensaje({ soy: "m" })).toContain("te toca pagarle");
  });

  it("lleva el nombre del viaje", () => {
    expect(mensaje()).toContain("*Lisboa*");
  });

  it("lleva el enlace para que mire las cuentas", () => {
    expect(mensaje()).toContain("https://saldocero.app/#ABC12345");
  });

  it("sin código, sin enlace", () => {
    expect(mensaje({ codigo: "" })).not.toContain("http");
  });

  it("respeta la moneda del viaje", () => {
    expect(mensaje({ moneda: "GBP", soy: "a" })).toContain("£108.83");
  });

  it("redondea los decimales de las cuentas", () => {
    const texto = mensaje({ pago: { ...pago, cantidad: 33.333333 }, soy: "a" });
    expect(texto).toContain("33.33 €");
  });
});

describe("enlaceWhatsApp", () => {
  it("abre WhatsApp sin número, con el texto", () => {
    expect(enlaceWhatsApp("hola")).toBe("https://wa.me/?text=hola");
  });

  it("codifica saltos de línea, emojis y la # del enlace", () => {
    const enlace = enlaceWhatsApp("a\nb 🙏 #X");

    expect(enlace).not.toMatch(/[\n #]/);
    expect(decodeURIComponent(enlace.split("text=")[1])).toBe("a\nb 🙏 #X");
  });
});
