import { describe, it, expect } from "vitest";
import { masDias, leerNoches, nochesDeCadaUno, mismasNoches } from "./noches";

const ana = { id: "a", nombre: "Ana", desde: null, hasta: null };
const luis = { id: "l", nombre: "Luis", desde: "2026-10-10", hasta: null };
const eva = { id: "e", nombre: "Eva", desde: null, hasta: "2026-10-10" };

describe("masDias", () => {
  it("pasa de mes y de año", () => {
    expect(masDias("2026-10-31")).toBe("2026-11-01");
    expect(masDias("2026-12-31")).toBe("2027-01-01");
    expect(masDias("2026-10-09", 3)).toBe("2026-10-12");
  });

  it("el cambio de hora no se come un día", () => {
    expect(masDias("2026-10-25")).toBe("2026-10-26");
    expect(masDias("2026-03-29")).toBe("2026-03-30");
  });
});

describe("leerNoches", () => {
  it("entiende un número entero de noches", () => {
    expect(leerNoches("3")).toBe(3);
    expect(leerNoches(" 2 ")).toBe(2);
    expect(leerNoches(1)).toBe(1);
  });

  it("lo que no son noches, null", () => {
    expect(leerNoches("")).toBeNull();
    expect(leerNoches("0")).toBeNull();
    expect(leerNoches("2,5")).toBeNull();
    expect(leerNoches("-1")).toBeNull();
    expect(leerNoches("31")).toBeNull();
    expect(leerNoches(undefined)).toBeNull();
  });
});

describe("nochesDeCadaUno", () => {
  it("el que está todo el viaje duerme todas", () => {
    expect(nochesDeCadaUno([ana], "2026-10-09", 3)).toEqual({ a: 3 });
  });

  it("el que llega el sábado no paga la noche del viernes", () => {
    // Viernes, sábado y domingo: Luis llega el sábado.
    expect(nochesDeCadaUno([ana, luis], "2026-10-09", 3)).toEqual({ a: 3, l: 2 });
  });

  it("el que se va el sábado no duerme el sábado", () => {
    expect(nochesDeCadaUno([ana, eva], "2026-10-09", 3)).toEqual({ a: 3, e: 1 });
  });

  it("el que no duerme ninguna no sale", () => {
    const deDia = { id: "d", nombre: "Dani", desde: "2026-10-10", hasta: "2026-10-10" };
    expect(nochesDeCadaUno([ana, deDia], "2026-10-09", 3)).toEqual({ a: 3 });
  });

  it("si no duerme nadie, null", () => {
    expect(nochesDeCadaUno([eva], "2026-10-12", 2)).toBeNull();
  });

  it("sin fecha o sin noches que valgan, null", () => {
    expect(nochesDeCadaUno([ana], "", 3)).toBeNull();
    expect(nochesDeCadaUno([ana], "2026-10-09", "0")).toBeNull();
  });

  it("las noches escritas en el campo valen", () => {
    expect(nochesDeCadaUno([ana, luis], "2026-10-09", "2")).toEqual({ a: 2, l: 1 });
  });
});

describe("mismasNoches", () => {
  it("todos las mismas", () => {
    expect(mismasNoches({ a: 2, l: 2 })).toBe(true);
    expect(mismasNoches({ a: 3 })).toBe(true);
  });

  it("unos más que otros", () => {
    expect(mismasNoches({ a: 3, l: 2 })).toBe(false);
  });
});
