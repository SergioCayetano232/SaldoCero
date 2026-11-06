import { describe, it, expect } from "vitest";
import {
  estaEseDia,
  presentesEseDia,
  ausentesEseDia,
  quienesSiguen,
  limpiarEstancia,
  tieneEstancia,
  textoEstancia,
} from "./estancia";

const ana = { id: "a", nombre: "Ana" };
const luis = { id: "l", nombre: "Luis", desde: "2026-09-12" };
const eva = { id: "e", nombre: "Eva", hasta: "2026-09-12" };
const viajeros = [ana, luis, eva];

describe("estaEseDia", () => {
  it("sin fechas, está todo el viaje", () => {
    expect(estaEseDia(ana, "2026-01-01")).toBe(true);
    expect(estaEseDia({ ...ana, desde: null, hasta: null }, "2026-09-11")).toBe(true);
  });

  it("antes de llegar no está, y el día que llega sí", () => {
    expect(estaEseDia(luis, "2026-09-11")).toBe(false);
    expect(estaEseDia(luis, "2026-09-12")).toBe(true);
  });

  it("el día que se va aún está, y al siguiente no", () => {
    expect(estaEseDia(eva, "2026-09-12")).toBe(true);
    expect(estaEseDia(eva, "2026-09-13")).toBe(false);
  });

  it("sin fecha en el gasto, cuenta como que está", () => {
    expect(estaEseDia(luis, "")).toBe(true);
  });
});

describe("presentesEseDia", () => {
  it("solo los que están ese día", () => {
    expect(presentesEseDia(viajeros, "2026-09-11")).toEqual(["a", "e"]);
    expect(presentesEseDia(viajeros, "2026-09-12")).toEqual(["a", "l", "e"]);
    expect(presentesEseDia(viajeros, "2026-09-13")).toEqual(["a", "l"]);
  });

  it("si no hay nadie, todos", () => {
    const solo = [luis, { ...eva, hasta: "2026-09-10" }];
    expect(presentesEseDia(solo, "2026-09-11")).toEqual(["l", "e"]);
  });
});

describe("ausentesEseDia", () => {
  it("los que faltan", () => {
    expect(ausentesEseDia(viajeros, "2026-09-11")).toEqual([luis]);
    expect(ausentesEseDia(viajeros, "2026-09-12")).toEqual([]);
  });

  it("si no está nadie no se avisa, que van todos", () => {
    expect(ausentesEseDia([luis], "2026-09-11")).toEqual([]);
  });
});

describe("quienesSiguen", () => {
  it("al copiar el desayuno a otro día, quita a los que no están", () => {
    expect(quienesSiguen(["a", "e"], viajeros, "2026-09-13")).toEqual(["a"]);
  });

  it("si no queda nadie, los de antes", () => {
    expect(quienesSiguen(["e"], viajeros, "2026-09-13")).toEqual(["e"]);
  });

  it("un id que ya no está en el viaje no se quita", () => {
    expect(quienesSiguen(["a", "x"], viajeros, "2026-09-13")).toEqual(["a", "x"]);
  });
});

describe("limpiarEstancia", () => {
  it("las deja como vienen", () => {
    expect(limpiarEstancia("2026-09-12", "2026-09-14")).toEqual({ desde: "2026-09-12", hasta: "2026-09-14" });
  });

  it("vacías o raras, null", () => {
    expect(limpiarEstancia("", undefined)).toEqual({ desde: null, hasta: null });
    expect(limpiarEstancia("mañana", "12/09/2026")).toEqual({ desde: null, hasta: null });
  });

  it("al revés, se les da la vuelta", () => {
    expect(limpiarEstancia("2026-09-14", "2026-09-12")).toEqual({ desde: "2026-09-12", hasta: "2026-09-14" });
  });

  it("una sola vale", () => {
    expect(limpiarEstancia("2026-09-12", "")).toEqual({ desde: "2026-09-12", hasta: null });
  });
});

describe("textoEstancia", () => {
  it("sin fechas, nada", () => {
    expect(tieneEstancia(ana)).toBe(false);
    expect(textoEstancia(ana)).toBeNull();
  });

  it("con una o con las dos", () => {
    expect(tieneEstancia(luis)).toBe(true);
    expect(textoEstancia(luis)).toMatch(/^desde el sáb/);
    expect(textoEstancia(eva)).toMatch(/^hasta el sáb/);
    expect(textoEstancia({ desde: "2026-09-12", hasta: "2026-09-13" })).toMatch(/^del sáb.* al dom/);
    expect(textoEstancia({ desde: "2026-09-12", hasta: "2026-09-12" })).toMatch(/^solo el sáb/);
  });
});
