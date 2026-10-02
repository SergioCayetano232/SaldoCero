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
    expect(cabecera).toBe("Fecha;Concepto;Categoría;Pagó;Importe;Moneda;Importe en EUR;Ana;Luis");
  });

  it("un gasto por fila, con coma decimal y lo que le toca a cada uno", () => {
    const [, fila] = lineas(gastosEnCSV({ gastos: [cena], viajeros, moneda: "EUR" }));
    expect(fila).toBe("2026-09-13;Cena;Comida;Ana;30,00;EUR;30,00;15,00;15,00");
  });

  it("en otra moneda, lo pagado y lo convertido", () => {
    const yenes = { ...cena, importe: 5000, importeConvertido: 31.25, moneda: "JPY" };
    const [, fila] = lineas(gastosEnCSV({ gastos: [yenes], viajeros, moneda: "EUR" }));
    expect(fila).toContain("5000,00;JPY;31,25;15,63;15,63");
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
    expect(filas.slice(1).map((f) => f.split(";")[1])).toEqual(["Taxi", "Cena"]);
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
