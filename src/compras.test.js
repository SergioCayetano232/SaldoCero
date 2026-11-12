import { describe, it, expect, afterEach } from "vitest";
import { separarCompras, nuevasCompras, ordenarCompras, conceptoDeCompras, categoriaDeCompras, LARGO_COMPRA } from "./compras";
import { LARGO_CONCEPTO } from "./concepto";
import { usarIdioma } from "./idioma";

const cosa = (texto, extra = {}) => ({ id: texto, texto, comprado: false, creadoEn: "2026-11-12T10:00", ...extra });

describe("separarCompras", () => {
  it("con comas y con y", () => {
    expect(separarCompras("pan, leche y huevos")).toEqual(["pan", "leche", "huevos"]);
  });

  it("con e delante de i", () => {
    expect(separarCompras("pan e hielo")).toEqual(["pan", "hielo"]);
  });

  it("una por línea, con guiones o números", () => {
    expect(separarCompras("- pan\n• leche\n3. huevos\n4) agua")).toEqual(["pan", "leche", "huevos", "agua"]);
  });

  it("sin huecos raros ni trozos vacíos", () => {
    expect(separarCompras("  pan  de   molde ,, ; leche ")).toEqual(["pan de molde", "leche"]);
  });

  it("lo muy largo se corta", () => {
    expect(separarCompras("a".repeat(80))[0]).toHaveLength(LARGO_COMPRA);
  });

  it("vacío, nada", () => {
    expect(separarCompras("")).toEqual([]);
    expect(separarCompras(undefined)).toEqual([]);
  });

  it("una y dentro de una palabra no parte", () => {
    expect(separarCompras("mayonesa")).toEqual(["mayonesa"]);
  });
});

describe("nuevasCompras", () => {
  it("lo que no está, entra", () => {
    expect(nuevasCompras("pan, leche", [cosa("Huevos")])).toEqual({ nuevas: ["pan", "leche"], repetidas: [] });
  });

  it("lo que ya falta no se repite, con o sin tildes", () => {
    expect(nuevasCompras("Plátanos, pan", [cosa("platanos")])).toEqual({ nuevas: ["pan"], repetidas: ["Plátanos"] });
  });

  it("lo ya comprado puede volver", () => {
    expect(nuevasCompras("pan", [cosa("pan", { comprado: true })]).nuevas).toEqual(["pan"]);
  });

  it("dos veces en lo mismo que escribes, una", () => {
    expect(nuevasCompras("pan, Pan")).toEqual({ nuevas: ["pan"], repetidas: ["Pan"] });
  });
});

describe("ordenarCompras", () => {
  it("lo que falta arriba y lo comprado abajo, cada uno por cuándo se apuntó", () => {
    const lista = [
      cosa("leche", { comprado: true, creadoEn: "2026-11-12T09:00" }),
      cosa("pan", { creadoEn: "2026-11-12T11:00" }),
      cosa("agua", { creadoEn: "2026-11-12T10:00" }),
    ];
    expect(ordenarCompras(lista).map((c) => c.texto)).toEqual(["agua", "pan", "leche"]);
  });

  it("no toca la lista de antes", () => {
    const lista = [cosa("b", { creadoEn: "2" }), cosa("a", { creadoEn: "1" })];
    ordenarCompras(lista);
    expect(lista.map((c) => c.texto)).toEqual(["b", "a"]);
  });
});

describe("conceptoDeCompras", () => {
  afterEach(() => usarIdioma("es"));

  it("todas, en una frase", () => {
    expect(conceptoDeCompras([cosa("Pan"), cosa("Leche"), cosa("huevos")])).toBe("Pan, leche y huevos");
  });

  it("una sola, con mayúscula", () => {
    expect(conceptoDeCompras([cosa("hielo")])).toBe("Hielo");
  });

  it("si no cabe, las primeras y cuántas más", () => {
    const cosas = ["papel de cocina", "bolsas de basura", "detergente", "crema solar", "pilas", "café"].map((t) => cosa(t));
    const concepto = conceptoDeCompras(cosas);
    expect(concepto.length).toBeLessThanOrEqual(LARGO_CONCEPTO);
    expect(concepto).toMatch(/^Papel de cocina, .* y \d cosas? más$/);
  });

  it("en inglés", () => {
    usarIdioma("en");
    expect(conceptoDeCompras([cosa("Bread"), cosa("milk")])).toBe("Bread and milk");
  });
});

describe("categoriaDeCompras", () => {
  it("si se adivina, esa", () => {
    expect(categoriaDeCompras([cosa("gasolina")])).toBe("transporte");
  });

  it("si no, compras", () => {
    expect(categoriaDeCompras([cosa("pilas"), cosa("cinta americana")])).toBe("compras");
  });
});
