import { describe, it, expect } from "vitest";
import { esUnaLista, gastosDeLista, textoApuntarLista } from "./pegarGastos";

const viajeros = [
  { id: "a", nombre: "Ana" },
  { id: "b", nombre: "Luis" },
  { id: "c", nombre: "Marta" },
];
const dia = "2026-11-02";
const leer = (texto, opciones = {}) => gastosDeLista(texto, viajeros, { dia, ...opciones });

describe("esUnaLista", () => {
  it("con dos líneas o más", () => {
    expect(esUnaLista("cena 45 ana\ntaxi 12 luis")).toBe(true);
  });

  it("una sola, o con líneas vacías alrededor, no", () => {
    expect(esUnaLista("cena 45 ana")).toBe(false);
    expect(esUnaLista("\ncena 45 ana\n\n")).toBe(false);
    expect(esUnaLista("")).toBe(false);
  });
});

describe("gastosDeLista", () => {
  it("cada línea, un gasto entre todos", () => {
    const { gastos, sinEntender } = leer("cena 45 ana\ntaxi 12,50 luis");
    expect(sinEntender).toEqual([]);
    expect(gastos).toEqual([
      { pagadorId: "a", importe: 45, moneda: "EUR", importeConvertido: 45, concepto: "Cena", categoria: "comida", fecha: dia, nota: null, participantes: ["a", "b", "c"], partes: null },
      { pagadorId: "b", importe: 12.5, moneda: "EUR", importeConvertido: 12.5, concepto: "Taxi", categoria: "transporte", fecha: dia, nota: null, participantes: ["a", "b", "c"], partes: null },
    ]);
  });

  it("sin los que ese día no están", () => {
    const llegaTarde = viajeros.map((v) => (v.id === "c" ? { ...v, desde: "2026-11-03" } : v));
    const { gastos } = gastosDeLista("cena 45 ana", llegaTarde, { dia });
    expect(gastos[0].participantes).toEqual(["a", "b"]);
    const otroDia = gastosDeLista("cena 45 ana", llegaTarde, { dia: "2026-11-03" });
    expect(otroDia.gastos[0].participantes).toEqual(["a", "b", "c"]);
  });

  it("quita los guiones y números de las notas", () => {
    const { gastos } = leer("- cena 45 ana\n2) taxi 12 luis\n• museo 20 marta");
    expect(gastos.map((g) => g.concepto)).toEqual(["Cena", "Taxi", "Museo"]);
  });

  it("el nombre delante también, y con pagó como al dictar", () => {
    const { gastos } = leer("ana: cena 45\ntaxi 12 pagó Luis");
    expect(gastos.map((g) => [g.pagadorId, g.concepto])).toEqual([["a", "Cena"], ["b", "Taxi"]]);
  });

  it("con nombres compuestos, el más largo", () => {
    const con = [...viajeros, { id: "d", nombre: "Ana María" }];
    const { gastos } = gastosDeLista("cena 45 ana maría\ntaxi 12 ana", con, { dia });
    expect(gastos.map((g) => [g.pagadorId, g.concepto])).toEqual([["d", "Cena"], ["a", "Taxi"]]);
  });

  it("sin pagador en la línea, el del formulario", () => {
    const { gastos } = leer("super 23,40\ngasolina 60", { pagadorId: "c" });
    expect(gastos.map((g) => g.pagadorId)).toEqual(["c", "c"]);
  });

  it("y sin ninguno, esa línea no se apunta", () => {
    const { gastos, sinEntender } = leer("super 23,40\ncena 45 ana");
    expect(gastos.map((g) => g.concepto)).toEqual(["Cena"]);
    expect(sinEntender).toEqual(["super 23,40"]);
  });

  it("sin importe tampoco", () => {
    const { gastos, sinEntender } = leer("museo ana\ncena 45 ana");
    expect(gastos).toHaveLength(1);
    expect(sinEntender).toEqual(["museo ana"]);
  });

  it("se salta las líneas vacías", () => {
    expect(leer("cena 45 ana\n\n\ntaxi 12 luis").gastos).toHaveLength(2);
  });

  it("en la moneda del viaje", () => {
    const [g] = leer("ramen 1200 ana\ntaxi 3000 luis", { moneda: "JPY" }).gastos;
    expect(g.moneda).toBe("JPY");
    expect(g.importeConvertido).toBe(1200);
  });

  it("entiende ayer y entre quiénes, como al dictar", () => {
    const [g] = leer("cena 45 ayer ana\ntaxi 12 luis").gastos;
    expect(g.fecha).not.toBe(dia);
  });

  it("menos alguno, sin confundirlo con el que pagó", () => {
    const { gastos } = leer("cena 45 ana menos luis\ncopas 30 menos marta\nagua sin gas 2 ana", { pagadorId: "c" });
    expect(gastos.map((g) => [g.pagadorId, g.concepto, g.participantes])).toEqual([
      ["a", "Cena", ["a", "c"]],
      ["c", "Copas", ["a", "b"]],
      ["a", "Agua sin gas", ["a", "b", "c"]],
    ]);
  });

  it("sin concepto, el de la categoría", () => {
    const { gastos } = leer("45 ana\n12 luis");
    expect(gastos.map((g) => g.concepto)).toEqual(["Gasto", "Gasto"]);
  });
});

describe("gastosDeLista en inglés", () => {
  it("con el nombre suelto o con paid", () => {
    const { gastos, sinEntender } = leer("dinner 45 ana\nluis: taxi 12.50\nmuseum 30 paid by marta");
    expect(sinEntender).toEqual([]);
    expect(gastos.map((g) => [g.pagadorId, g.importe, g.concepto, g.categoria])).toEqual([
      ["a", 45, "Dinner", "comida"],
      ["b", 12.5, "Taxi", "transporte"],
      ["c", 30, "Museum", "ocio"],
    ]);
  });

  it("except no se confunde con el que pagó", () => {
    const [gasto] = leer("beers 20 ana except luis").gastos;
    expect(gasto).toMatchObject({ pagadorId: "a", participantes: ["a", "c"] });
  });
});

describe("textoApuntarLista", () => {
  it("uno o varios", () => {
    expect(textoApuntarLista(1)).toBe("Apuntar 1 gasto");
    expect(textoApuntarLista(3)).toBe("Apuntar los 3 gastos");
  });
});
