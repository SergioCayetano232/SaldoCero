import { describe, it, expect, afterEach } from "vitest";
import {
  categoriaDe,
  todasLasCategorias,
  usarCategoriasPropias,
  categoriasPropias,
  limpiarPropias,
  nuevaCategoria,
  sePuedeQuitar,
  sinCategoria,
  paraGuardar,
  gastoPorCategoria,
  MAXIMO_PROPIAS,
} from "./categorias";
import { importeDeGasto } from "./calculos";
import { limpiarTopes, estadoDeTopes } from "./topes";
import { ordenarGastos } from "./ordenar";
import { categoriasDestino } from "./recategorizar";

const SUPER = { id: "p-super", nombre: "Super", emoji: "🛒", color: "#3d7dd8" };

afterEach(() => usarCategoriasPropias([]));

describe("nuevaCategoria", () => {
  it("la añade con su emoji, un id sacado del nombre y un color libre", () => {
    const { lista } = nuevaCategoria([], "  Súper  mercado ", "🛒");
    expect(lista).toEqual([{ id: "p-super-mercado", nombre: "Súper mercado", emoji: "🛒", color: "#3d7dd8", propia: true }]);
  });

  it("la segunda coge otro color", () => {
    const { lista } = nuevaCategoria(limpiarPropias([SUPER]), "Peajes", "🛣️");
    expect(lista[1].color).not.toBe(SUPER.color);
  });

  it("sin emoji, o con letras en vez de emoji, la etiqueta", () => {
    expect(nuevaCategoria([], "Peajes", "").lista[0].emoji).toBe("🏷️");
    expect(nuevaCategoria([], "Peajes", "pe").lista[0].emoji).toBe("🏷️");
  });

  it("de varios emojis, el primero", () => {
    expect(nuevaCategoria([], "Peajes", "🛣️🚗").lista[0].emoji).toBe("🛣️");
  });

  it("sin nombre o muy largo, no", () => {
    expect(nuevaCategoria([], "  ", "🛒").error).toBeTruthy();
    expect(nuevaCategoria([], "a".repeat(17), "🛒").error).toBeTruthy();
  });

  it("si ya existe, aunque sea de las de siempre o con otros acentos, no", () => {
    expect(nuevaCategoria([], "comida", "🍕").error).toContain("Comida");
    expect(nuevaCategoria([SUPER], "SÚPER", "🛒").error).toContain("Super");
  });

  it("hay un tope de propias", () => {
    let lista = [];
    for (let i = 0; i < MAXIMO_PROPIAS; i++) lista = nuevaCategoria(lista, `Cosa ${i}`, "🧩").lista;
    expect(nuevaCategoria(lista, "Una más", "🧩").error).toBeTruthy();
  });

  it("si el id ya está cogido, le pone un número", () => {
    const lista = [{ ...SUPER, nombre: "Otro nombre" }];
    expect(nuevaCategoria(lista, "Super", "🛒").lista[1].id).toBe("p-super-2");
  });
});

describe("limpiarPropias", () => {
  it("lo raro de la base de datos se tira", () => {
    expect(limpiarPropias(null)).toEqual([]);
    expect(limpiarPropias({ a: 1 })).toEqual([]);
    expect(limpiarPropias([{ id: "comida", nombre: "Comida" }, { id: "p-x", nombre: "" }, null])).toEqual([]);
  });

  it("le pone lo que falte", () => {
    expect(limpiarPropias([{ id: "p-x", nombre: "X" }])[0]).toMatchObject({ emoji: "🏷️", color: "#3d7dd8" });
  });

  it("para guardar va sin lo que se calcula", () => {
    expect(paraGuardar(limpiarPropias([SUPER]))).toEqual([SUPER]);
  });
});

describe("con las propias del viaje", () => {
  it("categoriaDe las encuentra", () => {
    usarCategoriasPropias([SUPER]);
    expect(categoriaDe("p-super").nombre).toBe("Super");
    expect(categoriasPropias()).toHaveLength(1);
  });

  it("van después de las de siempre y antes de Otros", () => {
    usarCategoriasPropias([SUPER]);
    const ids = todasLasCategorias().map((c) => c.id);
    expect(ids.indexOf("p-super")).toBe(ids.length - 2);
    expect(ids.at(-1)).toBe("otros");
  });

  it("si la quitan, sus gastos cuentan en Otros", () => {
    expect(categoriaDe("p-super").id).toBe("otros");
  });

  it("salen en lo gastado por categoría", () => {
    usarCategoriasPropias([SUPER]);
    const reparto = gastoPorCategoria([{ importe: 30, categoria: "p-super" }], importeDeGasto);
    expect(reparto[0]).toMatchObject({ id: "p-super", emoji: "🛒", total: 30 });
  });

  it("se les puede poner tope", () => {
    usarCategoriasPropias([SUPER]);
    expect(limpiarTopes({ "p-super": 100, "p-otra": 50 })).toEqual({ "p-super": 100 });
    expect(estadoDeTopes([{ importe: 40, categoria: "p-super" }], { "p-super": 100 })[0].gastado).toBe(40);
  });

  it("ordenar por categoría las pone en su sitio", () => {
    usarCategoriasPropias([SUPER]);
    const gastos = [
      { id: 1, importe: 5, categoria: "otros" },
      { id: 2, importe: 5, categoria: "p-super" },
      { id: 3, importe: 5, categoria: "comida" },
    ];
    expect(ordenarGastos(gastos, "categoria").map((g) => g.id)).toEqual([3, 2, 1]);
  });

  it("se pueden pasar gastos a ellas", () => {
    usarCategoriasPropias([SUPER]);
    expect(categoriasDestino([{ id: 1, categoria: "comida" }]).map((c) => c.id)).toContain("p-super");
  });
});

describe("quitar una propia", () => {
  it("solo si no tiene gastos", () => {
    expect(sePuedeQuitar("p-super", [{ categoria: "comida" }])).toBe(true);
    expect(sePuedeQuitar("p-super", [{ categoria: "p-super" }])).toBe(false);
  });

  it("sale de la lista", () => {
    expect(sinCategoria([SUPER], "p-super")).toEqual([]);
  });
});
