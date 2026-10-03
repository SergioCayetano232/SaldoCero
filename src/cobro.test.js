import { describe, it, expect } from "vitest";
import { leerCobro, cobroComoTexto, cobroDe, lineaDeCobro } from "./cobro";

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
