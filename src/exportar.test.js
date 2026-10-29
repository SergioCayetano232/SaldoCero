import { describe, it, expect } from "vitest";
import { gastosEnCSV, celda } from "./exportar";
import { BOTE } from "./bote";

const ana = { id: "a", nombre: "Ana" };
const luis = { id: "b", nombre: "Luis" };
const viajeros = [ana, luis];

const cena = {
  id: "g1",
  pagadorId: "a",
  importe: 30,
  importeConvertido: 30,
  moneda: "EUR",
  concepto: "Cena",
  categoria: "comida",
  fecha: "2026-09-13",
  participantes: ["a", "b"],
};

function lineas(csv) {
  return csv.split("\r\n");
}

describe("gastosEnCSV", () => {
  it("una cabecera con una columna por viajero", () => {
    const [cabecera] = lineas(gastosEnCSV({ gastos: [], viajeros, moneda: "EUR" }));
    expect(cabecera).toBe("Fecha;Concepto;Categoría;Pagó;Importe;Moneda;Importe en EUR;Nota;Ticket;Apuntado;Ana;Luis");
  });

  it("un gasto por fila, con coma decimal y lo que le toca a cada uno", () => {
    const [, fila] = lineas(gastosEnCSV({ gastos: [cena], viajeros, moneda: "EUR" }));
    expect(fila).toBe("2026-09-13;Cena;Comida;Ana;30,00;EUR;30,00;;No;;15,00;15,00");
  });

  it("en otra moneda, lo pagado y lo convertido", () => {
    const yenes = { ...cena, importe: 5000, importeConvertido: 31.25, moneda: "JPY" };
    const [, fila] = lineas(gastosEnCSV({ gastos: [yenes], viajeros, moneda: "EUR" }));
    expect(fila).toContain("5000,00;JPY;31,25;;No;;15,63;15,63");
  });

  it("con reparto desigual y gente que no va", () => {
    const tres = [...viajeros, { id: "c", nombre: "Marta" }];
    const gasto = { ...cena, participantes: ["a", "b"], partes: { a: 2, b: 1 } };
    const [, fila] = lineas(gastosEnCSV({ gastos: [gasto], viajeros: tres, moneda: "EUR" }));
    expect(fila.endsWith("20,00;10,00;0,00")).toBe(true);
  });

  it("los del bote dicen Bote", () => {
    const [, fila] = lineas(gastosEnCSV({ gastos: [{ ...cena, pagadorId: BOTE }], viajeros, moneda: "EUR" }));
    expect(fila.split(";")[3]).toBe("Bote");
  });

  it("del más antiguo al más nuevo", () => {
    const taxi = { ...cena, id: "g2", concepto: "Taxi", fecha: "2026-09-12" };
    const filas = lineas(gastosEnCSV({ gastos: [cena, taxi], viajeros, moneda: "EUR" }));
    expect(filas.slice(1, -2).map((f) => f.split(";")[1])).toEqual(["Taxi", "Cena"]);
  });

  it("con la nota, y entre comillas si lleva saltos de línea", () => {
    const conNota = { ...cena, nota: "Luis no tomó postre" };
    const [, fila] = lineas(gastosEnCSV({ gastos: [conNota], viajeros, moneda: "EUR" }));
    expect(fila.split(";")[7]).toBe("Luis no tomó postre");

    const enDos = { ...cena, nota: "con propina\ny el agua" };
    const csv = gastosEnCSV({ gastos: [enDos], viajeros, moneda: "EUR" });
    expect(csv).toContain(';"con propina\ny el agua";No;');
  });

  it("dice si lleva ticket", () => {
    const [, conFoto, sinFoto] = lineas(
      gastosEnCSV({ gastos: [{ ...cena, ticket: "viaje/g1.jpg" }, { ...cena, id: "g2" }], viajeros, moneda: "EUR" }),
    );
    expect(conFoto.split(";")[8]).toBe("Sí");
    expect(sinFoto.split(";")[8]).toBe("No");
  });

  it("cuándo se apuntó, en la hora de aquí", () => {
    // Sin zona, la fecha se lee en la hora local y la prueba no depende de dónde se corra.
    const [, fila] = lineas(gastosEnCSV({ gastos: [{ ...cena, creadoEn: "2026-09-13T21:05:40" }], viajeros, moneda: "EUR" }));
    expect(fila.split(";")[9]).toBe("2026-09-13 21:05");
  });

  it("al final, el total y lo de cada uno, tras una fila en blanco", () => {
    const yenes = { ...cena, id: "g2", importe: 5000, importeConvertido: 31.25, moneda: "JPY", participantes: ["a"] };
    const filas = lineas(gastosEnCSV({ gastos: [cena, yenes], viajeros, moneda: "EUR" }));
    expect(filas.at(-2)).toBe("");
    expect(filas.at(-1)).toBe(";Total;;;;;61,25;;;;46,25;15,00");
  });

  it("debajo del total, quién paga a quién y si ya está pagado", () => {
    const pagos = [
      { de: "Luis", a: "Ana", cantidad: 15, saldado: false },
      { de: "Marta", a: "Ana", cantidad: 8.5, saldado: true },
    ];
    const filas = lineas(gastosEnCSV({ gastos: [cena], viajeros, moneda: "EUR", pagos }));
    expect(filas.slice(-7)).toEqual([
      ";Total;;;;;30,00;;;;15,00;15,00",
      "",
      "",
      "Quién paga a quién",
      "Paga;Cobra;Cantidad en EUR;Estado",
      "Luis;Ana;15,00;Pendiente",
      "Marta;Ana;8,50;Pagado",
    ]);
  });

  it("debajo del total, lo de cada categoría de más a menos", () => {
    const hotel = { ...cena, id: "g2", concepto: "Hotel", categoria: "alojamiento", importe: 100, importeConvertido: 100 };
    const taxi = { ...cena, id: "g3", concepto: "Taxi", categoria: "transporte", importe: 25, importeConvertido: 20, moneda: "USD" };
    const filas = lineas(gastosEnCSV({ gastos: [cena, hotel, taxi], viajeros, moneda: "EUR" }));
    expect(filas.slice(-8)).toEqual([
      ";Total;;;;;150,00;;;;75,00;75,00",
      "",
      "",
      "En qué se fue",
      "Categoría;Importe en EUR;% del total",
      "Alojamiento;100,00;67",
      "Comida;30,00;20",
      "Transporte;20,00;13",
    ]);
  });

  it("y después, quién paga a quién", () => {
    const hotel = { ...cena, id: "g2", categoria: "alojamiento" };
    const filas = lineas(gastosEnCSV({ gastos: [cena, hotel], viajeros, moneda: "EUR", pagos: [] }));
    expect(filas.indexOf("En qué se fue")).toBeLessThan(filas.indexOf("Quién paga a quién"));
  });

  it("con una sola categoría, no sale", () => {
    expect(gastosEnCSV({ gastos: [cena], viajeros, moneda: "EUR" })).not.toContain("En qué se fue");
  });

  it("si nadie debe nada, lo dice", () => {
    const filas = lineas(gastosEnCSV({ gastos: [cena], viajeros, moneda: "EUR", pagos: [] }));
    expect(filas.slice(-2)).toEqual(["Quién paga a quién", "Nadie debe nada"]);
  });

  it("sin gastos, tampoco hay cuentas", () => {
    expect(lineas(gastosEnCSV({ gastos: [], viajeros, moneda: "EUR", pagos: [] }))).toHaveLength(1);
  });

  it("arriba, el nombre del viaje y sus días", () => {
    const taxi = { ...cena, id: "g2", fecha: "2026-09-11" };
    const antiguo = { ...cena, id: "g3", fecha: undefined };
    const filas = lineas(gastosEnCSV({ gastos: [cena, taxi, antiguo], viajeros, moneda: "EUR", nombre: "Lisboa" }));
    expect(filas[0]).toBe("Lisboa;del 2026-09-11 al 2026-09-13");
    expect(filas[1]).toBe("");
    expect(filas[2]).toMatch(/^Fecha;/);
  });

  it("con un solo día, el día; y sin gastos, solo el nombre", () => {
    expect(lineas(gastosEnCSV({ gastos: [cena], viajeros, moneda: "EUR", nombre: "Lisboa" }))[0]).toBe("Lisboa;2026-09-13");
    expect(lineas(gastosEnCSV({ gastos: [], viajeros, moneda: "EUR", nombre: "Lisboa" }))[0]).toBe("Lisboa;");
  });

  it("sin gastos, sin fila de total", () => {
    expect(lineas(gastosEnCSV({ gastos: [], viajeros, moneda: "EUR" }))).toHaveLength(1);
  });

  it("una categoría que ya no existe sale como Otros", () => {
    const [, fila] = lineas(gastosEnCSV({ gastos: [{ ...cena, categoria: "rara" }], viajeros, moneda: "EUR" }));
    expect(fila.split(";")[2]).toBe("Otros");
  });
});

describe("celda", () => {
  it("lo normal, tal cual", () => {
    expect(celda("Cena")).toBe("Cena");
  });

  it("con punto y coma o comillas, entre comillas", () => {
    expect(celda("Pan; vino")).toBe('"Pan; vino"');
    expect(celda('El "chiringuito"')).toBe('"El ""chiringuito"""');
  });

  it("lo que Excel tomaría por fórmula se queda en texto", () => {
    expect(celda("=SUMA(A1)")).toBe("'=SUMA(A1)");
    expect(celda("+34 600")).toBe("'+34 600");
    expect(celda("@hola")).toBe("'@hola");
  });

  it("vacío si no hay nada", () => {
    expect(celda(undefined)).toBe("");
  });
});
