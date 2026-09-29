import { describe, it, expect } from "vitest";
import { filtrarGastos, normalizar, hayFiltros, SIN_FILTROS } from "./filtros";

const ana = { id: "a", nombre: "Ana" };
const luis = { id: "b", nombre: "Luis" };
const marta = { id: "c", nombre: "Marta" };
const viajeros = [ana, luis, marta];

const gastos = [
  { id: "1", concepto: "Cena en la Cafetería", categoria: "comida", pagadorId: "a", participantes: ["a", "b", "c"] },
  { id: "2", concepto: "Taxi", categoria: "transporte", pagadorId: "b", participantes: ["b", "c"] },
  { id: "3", concepto: "Museo", categoria: "ocio", pagadorId: "c", participantes: ["c"] },
  // De los de antes: sin participantes ni categoría, que va entre todos y en "otros".
  { id: "4", concepto: "Peaje", pagadorId: "a" },
];

const ids = (lista) => lista.map((g) => g.id);
const con = (cambios) => ({ ...SIN_FILTROS, ...cambios });

describe("normalizar", () => {
  it("quita tildes y mayúsculas", () => {
    expect(normalizar("  Cafetería ")).toBe("cafeteria");
  });

  it("aguanta que no haya nada", () => {
    expect(normalizar(undefined)).toBe("");
  });
});

describe("hayFiltros", () => {
  it("sin nada, no", () => {
    expect(hayFiltros(SIN_FILTROS)).toBe(false);
  });

  it("unos espacios en el buscador no cuentan", () => {
    expect(hayFiltros(con({ texto: "   " }))).toBe(false);
  });

  it("con cualquiera de los tres, sí", () => {
    expect(hayFiltros(con({ texto: "taxi" }))).toBe(true);
    expect(hayFiltros(con({ viajeroId: "a" }))).toBe(true);
    expect(hayFiltros(con({ categoria: "ocio" }))).toBe(true);
  });
});

describe("filtrarGastos", () => {
  it("sin filtros salen todos", () => {
    expect(ids(filtrarGastos(gastos, SIN_FILTROS, viajeros))).toEqual(["1", "2", "3", "4"]);
  });

  it("busca en el concepto sin mirar tildes ni mayúsculas", () => {
    expect(ids(filtrarGastos(gastos, con({ texto: "cafeteria" }), viajeros))).toEqual(["1"]);
    expect(ids(filtrarGastos(gastos, con({ texto: "TAX" }), viajeros))).toEqual(["2"]);
  });

  it("por categoría", () => {
    expect(ids(filtrarGastos(gastos, con({ categoria: "ocio" }), viajeros))).toEqual(["3"]);
  });

  it("los que no tienen categoría cuentan como otros", () => {
    expect(ids(filtrarGastos(gastos, con({ categoria: "otros" }), viajeros))).toEqual(["4"]);
  });

  it("por persona: los que pagó y en los que está", () => {
    // Luis pagó el taxi y estaba en la cena. El peaje va entre todos.
    expect(ids(filtrarGastos(gastos, con({ viajeroId: "b" }), viajeros))).toEqual(["1", "2", "4"]);
  });

  it("si pagó algo que no era suyo, también sale", () => {
    const invitacion = { id: "5", concepto: "Regalo", pagadorId: "a", participantes: ["b"] };
    expect(ids(filtrarGastos([invitacion], con({ viajeroId: "a" }), viajeros))).toEqual(["5"]);
  });

  it("los filtros se suman", () => {
    const filtros = con({ viajeroId: "c", categoria: "transporte" });
    expect(ids(filtrarGastos(gastos, filtros, viajeros))).toEqual(["2"]);
  });

  it("si nada encaja, lista vacía", () => {
    expect(filtrarGastos(gastos, con({ texto: "submarinismo" }), viajeros)).toEqual([]);
  });
});
