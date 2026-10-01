import { describe, it, expect } from "vitest";
import { gastoAlFormulario, repetirGasto } from "./repetir";

const ana = { id: "a", nombre: "Ana" };
const luis = { id: "b", nombre: "Luis" };
const marta = { id: "c", nombre: "Marta" };
const viajeros = [ana, luis, marta];

const desayuno = {
  id: "1",
  pagadorId: "a",
  importe: 12.5,
  moneda: "EUR",
  importeConvertido: 12.5,
  concepto: "Desayuno",
  categoria: "comida",
  fecha: "2026-09-28",
  participantes: ["a", "b"],
  partes: { a: 1, b: 1 },
};

describe("gastoAlFormulario", () => {
  it("pasa todo al formulario, el importe como texto", () => {
    expect(gastoAlFormulario(desayuno, viajeros, "EUR")).toEqual({
      pagadorId: "a",
      importe: "12.5",
      moneda: "EUR",
      tasaAMano: null,
      concepto: "Desayuno",
      categoria: "comida",
      fecha: "2026-09-28",
      participantes: ["a", "b"],
      partes: {},
      repartoAbierto: false,
    });
  });

  it("en otra moneda, con el cambio con el que se guardó", () => {
    const cena = { ...desayuno, importe: 150, moneda: "MAD", importeConvertido: 13.88 };
    expect(gastoAlFormulario(cena, viajeros, "EUR").tasaAMano).toBe("0,092533");
  });

  it("si iba a partes distintas, las trae y abre el reparto", () => {
    const pizza = { ...desayuno, partes: { a: 2, b: 1 } };
    const formulario = gastoAlFormulario(pizza, viajeros, "EUR");
    expect(formulario.partes).toEqual({ a: 2, b: 1 });
    expect(formulario.repartoAbierto).toBe(true);
  });

  it("los de antes, sin participantes ni categoría: todos y otros", () => {
    const viejo = { id: "2", pagadorId: "a", importe: 30, concepto: "Peaje" };
    const formulario = gastoAlFormulario(viejo, viajeros, "EUR");
    expect(formulario.participantes).toEqual(["a", "b", "c"]);
    expect(formulario.categoria).toBe("otros");
    expect(formulario.moneda).toBe("EUR");
  });

  it("los que ya no están en el viaje no se suben", () => {
    const formulario = gastoAlFormulario(desayuno, [ana, marta], "EUR");
    expect(formulario.participantes).toEqual(["a"]);
  });
});

describe("repetirGasto", () => {
  it("igual que el original, pero con la fecha de hoy", () => {
    const copia = repetirGasto(desayuno, viajeros, "EUR", "2026-10-01");
    expect(copia.fecha).toBe("2026-10-01");
    expect(copia.concepto).toBe("Desayuno");
    expect(copia.participantes).toEqual(["a", "b"]);
  });

  it("no toca el gasto original", () => {
    repetirGasto(desayuno, viajeros, "EUR", "2026-10-01");
    expect(desayuno.fecha).toBe("2026-09-28");
  });
});
