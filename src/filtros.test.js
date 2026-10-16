import { describe, it, expect } from "vitest";
import { filtrarGastos, cuadraElImporte, normalizar, hayFiltros, soloDe, soloDelDia, SIN_FILTROS, hayTickets, hayNotas, hayOtrasMonedas, hayDeAlgunos, hayGastosDeHoy } from "./filtros";

const ana = { id: "a", nombre: "Ana" };
const luis = { id: "b", nombre: "Luis" };
const marta = { id: "c", nombre: "Marta" };
const viajeros = [ana, luis, marta];

const gastos = [
  { id: "1", concepto: "Cena en la Cafetería", categoria: "comida", pagadorId: "a", participantes: ["a", "b", "c"] },
  { id: "2", concepto: "Taxi", categoria: "transporte", pagadorId: "b", participantes: ["b", "c"], nota: "Incluye la propina", ticket: "v1/2.jpg" },
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

describe("soloDe", () => {
  it("filtra por esa persona y nada más", () => {
    expect(soloDe("b")).toEqual({ texto: "", viajeroId: "b", categoria: "", fecha: "", conTicket: false, conNota: false, otraMoneda: false, deAlgunos: false });
  });

  it("salen los que pagó y en los que está", () => {
    expect(ids(filtrarGastos(gastos, soloDe("b"), viajeros))).toEqual(["1", "2", "4"]);
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

  it("busca también en la nota", () => {
    expect(ids(filtrarGastos(gastos, con({ texto: "propina" }), viajeros))).toEqual(["2"]);
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

describe("por día", () => {
  const conFecha = [
    { id: "1", concepto: "Cena", pagadorId: "a", fecha: "2026-10-10" },
    { id: "2", concepto: "Taxi", pagadorId: "b", fecha: "2026-10-11" },
    { id: "3", concepto: "Café", pagadorId: "a", fecha: "2026-10-11" },
    // Los de antes de las fechas no traen ninguna.
    { id: "4", concepto: "Peaje", pagadorId: "a" },
  ];

  it("solo los de ese día", () => {
    expect(ids(filtrarGastos(conFecha, soloDelDia("2026-10-11"), viajeros))).toEqual(["2", "3"]);
  });

  it("cuenta como filtro", () => {
    expect(hayFiltros(soloDelDia("2026-10-11"))).toBe(true);
  });

  it("quita lo que hubiera filtrado antes", () => {
    expect(soloDelDia("2026-10-10")).toEqual({ ...SIN_FILTROS, fecha: "2026-10-10" });
  });

  it("se suma a los demás filtros", () => {
    const filtros = con({ fecha: "2026-10-11", texto: "café" });
    expect(ids(filtrarGastos(conFecha, filtros, viajeros))).toEqual(["3"]);
  });

  it("un filtro de antes, sin fecha, no deja fuera a nadie", () => {
    const viejo = { texto: "", viajeroId: "", categoria: "transporte" };
    expect(ids(filtrarGastos(gastos, viejo, viajeros))).toEqual(["2"]);
  });
});

describe("cuadraElImporte", () => {
  const cena = { importe: 12.5 };
  // Pagado en libras, con el cambio ya hecho.
  const pub = { importe: 20, importeConvertido: 23.4 };

  it("con céntimos, justo ese, con coma o punto", () => {
    expect(cuadraElImporte(cena, "12,50")).toBe(true);
    expect(cuadraElImporte(cena, "12.5")).toBe(true);
    expect(cuadraElImporte(cena, "12,51")).toBe(false);
  });

  it("sin céntimos, cualquiera de ese euro", () => {
    expect(cuadraElImporte(cena, "12")).toBe(true);
    expect(cuadraElImporte(cena, "13")).toBe(false);
  });

  it("vale lo pagado y lo convertido", () => {
    expect(cuadraElImporte(pub, "20")).toBe(true);
    expect(cuadraElImporte(pub, "23,40")).toBe(true);
  });

  it("lo que no es un número, no", () => {
    expect(cuadraElImporte(cena, "cena")).toBe(false);
    expect(cuadraElImporte(cena, "")).toBe(false);
    expect(cuadraElImporte(cena, "12,505")).toBe(false);
  });
});

describe("buscar por importe", () => {
  const conImportes = [
    { id: "1", concepto: "Cena", importe: 45.6, pagadorId: "a" },
    { id: "2", concepto: "Menú 2", importe: 12, pagadorId: "a" },
    { id: "3", concepto: "Taxi", importe: 2.3, pagadorId: "a" },
  ];

  it("encuentra por importe y sigue encontrando por concepto", () => {
    expect(ids(filtrarGastos(conImportes, con({ texto: "45,60" }), viajeros))).toEqual(["1"]);
    // "2" está en el concepto del menú y es el euro del taxi.
    expect(ids(filtrarGastos(conImportes, con({ texto: "2" }), viajeros))).toEqual(["2", "3"]);
  });
});

describe("solo con ticket", () => {
  it("cuenta como filtro", () => {
    expect(hayFiltros(con({ conTicket: true }))).toBe(true);
  });

  it("deja solo los que llevan foto", () => {
    expect(ids(filtrarGastos(gastos, con({ conTicket: true }), viajeros))).toEqual(["2"]);
  });

  it("se junta con los demás filtros", () => {
    expect(ids(filtrarGastos(gastos, con({ conTicket: true, categoria: "comida" }), viajeros))).toEqual([]);
  });

  it("apagado no quita nada", () => {
    expect(filtrarGastos(gastos, SIN_FILTROS, viajeros)).toHaveLength(4);
  });
});

describe("hayTickets", () => {
  it("con alguna foto, sí; sin ninguna, no", () => {
    expect(hayTickets(gastos)).toBe(true);
    expect(hayTickets(gastos.filter((g) => !g.ticket))).toBe(false);
    expect(hayTickets([])).toBe(false);
  });
});

describe("solo con nota", () => {
  it("cuenta como filtro", () => {
    expect(hayFiltros(con({ conNota: true }))).toBe(true);
  });

  it("deja solo los que llevan nota", () => {
    expect(ids(filtrarGastos(gastos, con({ conNota: true }), viajeros))).toEqual(["2"]);
  });

  it("una nota en blanco no cuenta", () => {
    const enBlanco = [{ id: "5", concepto: "Pan", pagadorId: "a", nota: "   " }];
    expect(filtrarGastos(enBlanco, con({ conNota: true }), viajeros)).toEqual([]);
    expect(hayNotas(enBlanco)).toBe(false);
  });

  it("se junta con los demás filtros", () => {
    expect(ids(filtrarGastos(gastos, con({ conNota: true, viajeroId: "a" }), viajeros))).toEqual([]);
  });
});

describe("solo en otra moneda", () => {
  const conMonedas = [
    { id: "1", concepto: "Cena", pagadorId: "a", moneda: "EUR" },
    { id: "2", concepto: "Tuk-tuk", pagadorId: "b", participantes: ["b"], moneda: "THB", importe: 200, importeConvertido: 5.2 },
    { id: "3", concepto: "Taxi", pagadorId: "c", participantes: ["c"], moneda: "USD", importe: 10, importeConvertido: 10 },
    // De antes de las monedas: va en la del viaje.
    { id: "4", concepto: "Peaje", pagadorId: "a" },
  ];

  it("cuenta como filtro", () => {
    expect(hayFiltros(con({ otraMoneda: true }))).toBe(true);
  });

  it("deja solo los que no van en la moneda del viaje", () => {
    expect(ids(filtrarGastos(conMonedas, con({ otraMoneda: true }), viajeros, "EUR"))).toEqual(["2", "3"]);
  });

  it("aunque el cambio fuera uno a uno", () => {
    expect(ids(filtrarGastos(conMonedas, con({ otraMoneda: true }), viajeros, "EUR"))).toContain("3");
  });

  it("en un viaje en dólares, el euro es la otra", () => {
    expect(ids(filtrarGastos(conMonedas, con({ otraMoneda: true }), viajeros, "USD"))).toEqual(["1", "2"]);
  });

  it("se junta con los demás filtros", () => {
    expect(ids(filtrarGastos(conMonedas, con({ otraMoneda: true, viajeroId: "b" }), viajeros, "EUR"))).toEqual(["2"]);
  });

  it("hayOtrasMonedas: solo si alguno va en otra", () => {
    expect(hayOtrasMonedas(conMonedas, "EUR")).toBe(true);
    expect(hayOtrasMonedas([conMonedas[0], conMonedas[3]], "EUR")).toBe(false);
    expect(hayOtrasMonedas([], "EUR")).toBe(false);
  });
});

describe("solo los que no son de todos", () => {
  it("cuenta como filtro", () => {
    expect(hayFiltros(con({ deAlgunos: true }))).toBe(true);
  });

  it("deja los que no van entre todos", () => {
    // El 1 lleva a los tres y el 4 es de antes, sin participantes: esos son de todos.
    expect(ids(filtrarGastos(gastos, con({ deAlgunos: true }), viajeros))).toEqual(["2", "3"]);
  });

  it("repartido entre todos, aunque sea a partes desiguales, es de todos", () => {
    const desigual = [{ id: "5", concepto: "Cena", pagadorId: "a", participantes: ["a", "b", "c"], partes: { a: 2, b: 1, c: 1 } }];
    expect(filtrarGastos(desigual, con({ deAlgunos: true }), viajeros)).toEqual([]);
  });

  it("si llega alguien nuevo, lo de antes ya no es de todos", () => {
    const conOscar = [...viajeros, { id: "d", nombre: "Óscar" }];
    expect(ids(filtrarGastos(gastos, con({ deAlgunos: true }), conOscar))).toEqual(["1", "2", "3"]);
  });

  it("se junta con los demás filtros", () => {
    expect(ids(filtrarGastos(gastos, con({ deAlgunos: true, categoria: "ocio" }), viajeros))).toEqual(["3"]);
  });

  it("hayDeAlgunos: solo si alguno no es de todos", () => {
    expect(hayDeAlgunos(gastos, viajeros)).toBe(true);
    expect(hayDeAlgunos([gastos[0], gastos[3]], viajeros)).toBe(false);
    expect(hayDeAlgunos([], viajeros)).toBe(false);
  });
});

describe("hayNotas", () => {
  it("con alguna nota, sí; sin ninguna, no", () => {
    expect(hayNotas(gastos)).toBe(true);
    expect(hayNotas(gastos.filter((g) => !g.nota))).toBe(false);
    expect(hayNotas([])).toBe(false);
  });
});

describe("hayGastosDeHoy", () => {
  const conFecha = [
    { id: "1", concepto: "Cena", pagadorId: "a", fecha: "2026-10-14" },
    { id: "2", concepto: "Taxi", pagadorId: "a", fecha: "2026-10-15" },
  ];

  it("con algo apuntado ese día, sí", () => {
    expect(hayGastosDeHoy(conFecha, "2026-10-15")).toBe(true);
  });

  it("sin nada ese día, no", () => {
    expect(hayGastosDeHoy(conFecha, "2026-10-16")).toBe(false);
    expect(hayGastosDeHoy([], "2026-10-15")).toBe(false);
  });

  it("los de antes de las fechas no cuentan", () => {
    expect(hayGastosDeHoy(gastos, "2026-10-15")).toBe(false);
  });
});
