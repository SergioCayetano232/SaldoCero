import { describe, it, expect } from "vitest";
import { leerCobro, cobroComoTexto, cobroDe, lineaDeCobro, cantidadParaPegar, enlaceDeCobro, esEnlace } from "./cobro";

// Un IBAN de ejemplo que pasa el control.
const IBAN = "ES9121000418450200051332";

describe("leerCobro", () => {
  it("un móvil es Bizum, se escriba como se escriba", () => {
    for (const texto of ["612345678", "612 34 56 78", "+34 612-345-678", "0034612345678"]) {
      expect(leerCobro(texto)).toEqual({ tipo: "bizum", valor: "612345678" });
    }
  });

  it("los que empiezan por 7 también", () => {
    expect(leerCobro("712345678")?.tipo).toBe("bizum");
  });

  it("un fijo no vale para Bizum", () => {
    expect(leerCobro("912345678")).toBeNull();
  });

  it("un IBAN, con espacios y en minúsculas", () => {
    expect(leerCobro("es91 2100 0418 4502 0005 1332")).toEqual({ tipo: "iban", valor: IBAN });
  });

  it("un IBAN de fuera también", () => {
    expect(leerCobro("DE89 3704 0044 0532 0130 00")?.tipo).toBe("iban");
  });

  it("con una cifra cambiada, el control lo pilla", () => {
    expect(leerCobro("ES9121000418450200051333")).toBeNull();
  });

  it("vacío o cualquier otra cosa, nada", () => {
    expect(leerCobro("")).toBeNull();
    expect(leerCobro(undefined)).toBeNull();
    expect(leerCobro("hola")).toBeNull();
    expect(leerCobro("61234567")).toBeNull();
  });
});

describe("cobroComoTexto", () => {
  it("el móvil de tres en tres", () => {
    expect(cobroComoTexto({ tipo: "bizum", valor: "612345678" })).toBe("612 345 678");
  });

  it("el IBAN de cuatro en cuatro", () => {
    expect(cobroComoTexto({ tipo: "iban", valor: IBAN })).toBe("ES91 2100 0418 4502 0005 1332");
  });

  it("sin cobro, nada", () => {
    expect(cobroComoTexto(null)).toBe("");
  });
});

describe("cobroDe", () => {
  it("lo saca del viajero", () => {
    expect(cobroDe({ nombre: "Ana", cobro: "612345678" })?.tipo).toBe("bizum");
  });

  it("los viajeros de antes no traen, y no pasa nada", () => {
    expect(cobroDe({ nombre: "Ana" })).toBeNull();
    expect(cobroDe(undefined)).toBeNull();
  });
});

describe("lineaDeCobro", () => {
  it("con nombre, de quién es", () => {
    expect(lineaDeCobro({ tipo: "bizum", valor: "612345678" }, "Ana")).toBe("Bizum a Ana: 612 345 678");
    expect(lineaDeCobro({ tipo: "iban", valor: IBAN }, "Ana")).toBe("IBAN de Ana: ES91 2100 0418 4502 0005 1332");
  });

  it("sin nombre, el tuyo", () => {
    expect(lineaDeCobro({ tipo: "bizum", valor: "612345678" })).toBe("Mi Bizum: 612 345 678");
  });

  it("sin cobro, nada", () => {
    expect(lineaDeCobro(null, "Ana")).toBeNull();
  });
});

describe("cantidadParaPegar", () => {
  it("con coma y dos decimales", () => {
    expect(cantidadParaPegar(12.5)).toBe("12,50");
    expect(cantidadParaPegar(0.07)).toBe("0,07");
  });

  it("si es redonda, sin decimales", () => {
    expect(cantidadParaPegar(30)).toBe("30");
  });

  it("sin colas de decimales de las cuentas", () => {
    expect(cantidadParaPegar(33.333333)).toBe("33,33");
    expect(cantidadParaPegar(19.999999)).toBe("20");
  });
});

describe("PayPal.me y Revolut", () => {
  it("el enlace de PayPal, se pegue como se pegue", () => {
    for (const texto of ["paypal.me/Ana", "https://www.paypal.me/ana/", " PayPal.me/ANA ", "https://paypal.com/paypalme/ana"]) {
      expect(leerCobro(texto)).toEqual({ tipo: "paypal", valor: "paypal.me/ana" });
    }
  });

  it("el de Revolut, con su punto o su guion", () => {
    expect(leerCobro("https://revolut.me/ana.m-23")).toEqual({ tipo: "revolut", valor: "revolut.me/ana.m-23" });
  });

  it("lo que se guarda se vuelve a leer igual", () => {
    expect(cobroDe({ cobro: "paypal.me/ana" })).toEqual({ tipo: "paypal", valor: "paypal.me/ana" });
    expect(cobroDe({ cobro: "revolut.me/ana" })?.tipo).toBe("revolut");
  });

  it("cabe en los 40 de la base de datos", () => {
    expect(leerCobro(`revolut.me/${"a".repeat(25)}`).valor.length).toBeLessThanOrEqual(40);
    expect(leerCobro(`revolut.me/${"a".repeat(26)}`)).toBeNull();
  });

  it("sin usuario, u otra web, no vale", () => {
    expect(leerCobro("paypal.me/")).toBeNull();
    expect(leerCobro("paypal.me/ana/12EUR")).toBeNull();
    expect(leerCobro("bizum.me/ana")).toBeNull();
    expect(leerCobro("https://paypal.me.timo.com/ana")).toBeNull();
  });

  it("solo estos dos son enlaces", () => {
    expect(esEnlace({ tipo: "paypal", valor: "paypal.me/ana" })).toBe(true);
    expect(esEnlace({ tipo: "bizum", valor: "612345678" })).toBe(false);
    expect(esEnlace(null)).toBe(false);
  });

  it("se enseña tal cual", () => {
    expect(cobroComoTexto({ tipo: "paypal", valor: "paypal.me/ana" })).toBe("paypal.me/ana");
  });

  it("a PayPal le va la cifra en el enlace, sin céntimos de más", () => {
    const cobro = { tipo: "paypal", valor: "paypal.me/ana" };
    expect(enlaceDeCobro(cobro, 12.5, "EUR")).toBe("https://paypal.me/ana/12.5EUR");
    expect(enlaceDeCobro(cobro, 33.333333, "USD")).toBe("https://paypal.me/ana/33.33USD");
    expect(enlaceDeCobro(cobro)).toBe("https://paypal.me/ana");
  });

  it("a Revolut no, que no tiene cómo", () => {
    expect(enlaceDeCobro({ tipo: "revolut", valor: "revolut.me/ana" }, 12.5, "EUR")).toBe("https://revolut.me/ana");
  });

  it("Bizum e IBAN no tienen enlace", () => {
    expect(enlaceDeCobro({ tipo: "bizum", valor: "612345678" }, 10, "EUR")).toBeNull();
  });

  it("en la línea va el enlace para que se pueda tocar", () => {
    const cobro = { tipo: "paypal", valor: "paypal.me/ana" };
    expect(lineaDeCobro(cobro, "Ana")).toBe("PayPal de Ana: https://paypal.me/ana");
    expect(lineaDeCobro(cobro, null, 20, "EUR")).toBe("Mi PayPal: https://paypal.me/ana/20EUR");
    expect(lineaDeCobro({ tipo: "revolut", valor: "revolut.me/ana" }, "Ana")).toBe("Revolut de Ana: https://revolut.me/ana");
  });
});
