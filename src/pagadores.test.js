import { describe, it, expect } from "vitest";
import { idsDeQuienPago, pagoEnElGasto, nombreDeQuienPago, pagadoresDeLoEscrito, pagadorPrincipal, loQueFaltaPorPagar } from "./pagadores";
import { calcularBalances, loQuePuso, pagosDelViaje } from "./calculos";
import { cuentaDe } from "./loDeUno";
import { cuantosPago } from "./pagados";
import { filtrarGastos, SIN_FILTROS } from "./filtros";
import { gastosEnCSV } from "./exportar";
import { gastoAlFormulario } from "./repetir";
import { BOTE } from "./bote";

const viajeros = [
  { id: "a", nombre: "Ana" },
  { id: "l", nombre: "Luis" },
  { id: "e", nombre: "Eva" },
];
// La cena de 60: Ana puso 40 y Luis 20, y era de los tres.
const cena = { id: "c", pagadorId: "a", pagadores: { a: 40, l: 20 }, importe: 60, importeConvertido: 60, moneda: "EUR", concepto: "Cena", categoria: "comida" };
const taxi = { id: "t", pagadorId: "e", importe: 30, importeConvertido: 30, moneda: "EUR", concepto: "Taxi", categoria: "transporte" };

describe("quién pagó", () => {
  it("entre varios, de más a menos", () => {
    expect(idsDeQuienPago(cena)).toEqual(["a", "l"]);
    expect(idsDeQuienPago(taxi)).toEqual(["e"]);
  });

  it("con uno solo en pagadores, como si nada", () => {
    expect(idsDeQuienPago({ ...taxi, pagadores: { e: 30 } })).toEqual(["e"]);
  });

  it("si pagó", () => {
    expect(pagoEnElGasto(cena, "l")).toBe(true);
    expect(pagoEnElGasto(cena, "e")).toBe(false);
  });

  it("los nombres", () => {
    expect(nombreDeQuienPago(cena, viajeros)).toBe("Ana y Luis");
    expect(nombreDeQuienPago(taxi, viajeros)).toBe("Eva");
    expect(nombreDeQuienPago({ ...taxi, pagadorId: BOTE }, viajeros)).toBe("el bote");
  });
});

describe("loQuePuso", () => {
  it("cada uno lo suyo, en la moneda del viaje", () => {
    const enYenes = { ...cena, importe: 6000, importeConvertido: 36, moneda: "JPY", pagadores: { a: 4000, l: 2000 } };
    expect(loQuePuso(enYenes, viajeros)).toEqual(new Map([["a", 24], ["l", 12]]));
  });

  it("si uno ya no está, todo para el pagador", () => {
    expect(loQuePuso(cena, viajeros.filter((v) => v.id !== "l"))).toEqual(new Map([["a", 60]]));
  });

  it("sin varios, el de siempre", () => {
    expect(loQuePuso(taxi, viajeros)).toEqual(new Map([["e", 30]]));
  });
});

describe("las cuentas con un gasto pagado entre varios", () => {
  const balances = calcularBalances(viajeros, [cena, taxi]);

  it("lo puesto de cada uno", () => {
    expect(balances.map((b) => b.puesto)).toEqual([40, 20, 30]);
    // A cada uno le tocan 20 de la cena y 10 del taxi.
    expect(balances.map((b) => b.balance)).toEqual([10, -10, 0]);
  });

  it("quién paga a quién", () => {
    expect(pagosDelViaje(balances, {}).map((p) => [p.de, p.a, p.cantidad])).toEqual([["Luis", "Ana", 10]]);
  });

  it("lo de uno, sus veces y el buscador", () => {
    expect(cuentaDe([cena, taxi], "l", viajeros)).toEqual({ pagado: 20, leToca: 30 });
    expect(cuantosPago([cena, taxi], "l")).toBe(1);
    expect(filtrarGastos([cena, taxi], { ...SIN_FILTROS, viajeroId: "l" }, viajeros, "EUR").map((g) => g.id)).toEqual(["c", "t"]);
    expect(filtrarGastos([cena, taxi], { ...SIN_FILTROS, texto: "luis" }, viajeros, "EUR").map((g) => g.id)).toEqual(["c"]);
  });

  it("en el Excel, los dos en Pagó y lo de cada uno en Puso", () => {
    const filas = gastosEnCSV({ gastos: [cena], viajeros, moneda: "EUR" }).split("\r\n");
    expect(filas[1].split(";")[4]).toBe("Ana y Luis");
    expect(filas.at(-1)).toBe(";;Puso;;;;;;;;;40,00;20,00;0,00");
  });

  it("al editarlo, el formulario trae lo de cada uno", () => {
    expect(gastoAlFormulario(cena, viajeros, "EUR").pagadores).toEqual({ a: "40", l: "20" });
    expect(gastoAlFormulario(taxi, viajeros, "EUR").pagadores).toEqual({});
  });
});

describe("del formulario", () => {
  it("lo escrito a lo que se guarda, solo con más de uno", () => {
    expect(pagadoresDeLoEscrito({ a: "40", l: "20,5", e: "" })).toEqual({ a: 40, l: 20.5 });
    expect(pagadoresDeLoEscrito({ a: "40", l: "" })).toBeNull();
  });

  it("el que más puso es el pagador", () => {
    expect(pagadorPrincipal({ a: 10, l: 40 })).toBe("l");
  });

  it("lo que falta para cuadrar", () => {
    expect(loQueFaltaPorPagar({ a: "40", l: "20" }, 60)).toBe(0);
    expect(loQueFaltaPorPagar({ a: "40", l: "15" }, 60)).toBe(5);
    expect(loQueFaltaPorPagar({ a: "40", l: "25" }, 60)).toBe(-5);
  });
});
