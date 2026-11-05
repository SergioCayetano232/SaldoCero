import { describe, it, expect } from "vitest";
import { calcularBalances, calcularTotal, mediaPorGasto, esDevolucion, soloGastos, pagosDelViaje } from "./calculos";
import { gastoPorDia } from "./barras";
import { cifrasDelViaje } from "./cifras";
import { gastoAlFormulario } from "./repetir";
import { gastoPorCategoria } from "./categorias";
import { importeDeGasto } from "./calculos";

const viajeros = [
  { id: "a", nombre: "Ana" },
  { id: "l", nombre: "Luis" },
  { id: "e", nombre: "Eva" },
  { id: "p", nombre: "Pepe" },
];
const gasto = (id, pagadorId, importe, extra = {}) => ({
  id, pagadorId, importe, importeConvertido: importe, moneda: "EUR", concepto: id, categoria: "alojamiento", fecha: "2026-11-01", ...extra,
});

// Ana paga la casa con 400 de fianza. Al irse, la fianza le vuelve a ella.
const casa = gasto("casa", "a", 800);
const fianza = gasto("fianza", "a", -400, { fecha: "2026-11-04" });

describe("devoluciones", () => {
  it("son los gastos en negativo", () => {
    expect(esDevolucion(fianza)).toBe(true);
    expect(esDevolucion(casa)).toBe(false);
    expect(soloGastos([casa, fianza])).toEqual([casa]);
  });

  it("restan del total", () => {
    expect(calcularTotal([casa, fianza])).toBe(400);
  });

  it("al que la recibe le baja lo puesto, y a cada uno lo que le toca", () => {
    const [ana, luis] = calcularBalances(viajeros, [casa, fianza]);
    expect(ana).toMatchObject({ puesto: 400, tocaPagar: 100, balance: 300 });
    expect(luis).toMatchObject({ puesto: 0, tocaPagar: 100, balance: -100 });
  });

  it("al final, cada uno paga solo lo que costó de verdad", () => {
    const pagos = pagosDelViaje(calcularBalances(viajeros, [casa, fianza]), {});
    expect(pagos.map((p) => [p.de, p.a, p.cantidad])).toEqual([
      ["Luis", "Ana", 100],
      ["Eva", "Ana", 100],
      ["Pepe", "Ana", 100],
    ]);
  });

  it("si solo era de algunos, solo a esos les resta", () => {
    const parking = gasto("parking", "l", -20, { participantes: ["l", "e"] });
    const [ana, luis, eva] = calcularBalances(viajeros, [parking]);
    expect(ana.balance).toBe(0);
    expect(luis.balance).toBe(-10);
    expect(eva.balance).toBe(10);
  });

  it("repartida a partes desiguales, también", () => {
    const vuelta = gasto("vuelta", "a", -30, { participantes: ["a", "l"], partes: { a: 2, l: 1 } });
    const [ana, luis] = calcularBalances(viajeros, [vuelta]);
    expect(ana.tocaPagar).toBe(-20);
    expect(luis.tocaPagar).toBe(-10);
  });

  it("la media es de los gastos, sin las devoluciones", () => {
    expect(mediaPorGasto([casa, gasto("cena", "e", 100), fianza])).toBe(450);
  });

  it("en la gráfica por días, un día con solo la devolución queda a cero", () => {
    const dias = gastoPorDia([casa, fianza]);
    expect(dias.at(-1)).toEqual({ fecha: "2026-11-04", total: 0, gastos: 1 });
  });

  it("por categoría resta de la suya", () => {
    const [aloja] = gastoPorCategoria([casa, fianza], importeDeGasto);
    expect(aloja.total).toBe(400);
  });

  it("en las cifras del viaje no cuenta como el gasto más pequeño, pero sí resta del total", () => {
    const personas = calcularBalances(viajeros, [casa, gasto("cena", "e", 100), fianza]);
    const cifras = cifrasDelViaje([casa, gasto("cena", "e", 100), fianza], personas, "EUR");
    expect(cifras.total).toBe(500);
    expect(cifras.gastoMasPequeno.importe).toBe(100);
  });

  it("al editarla, el formulario la trae en positivo y marcada", () => {
    expect(gastoAlFormulario(fianza, viajeros, "EUR")).toMatchObject({ importe: "400", devolucion: true });
    expect(gastoAlFormulario(casa, viajeros, "EUR")).toMatchObject({ importe: "800", devolucion: false });
  });

  it("por importes se reconoce aunque vaya en negativo", () => {
    const repartida = gasto("vuelta", "a", -30, { participantes: ["a", "l"], partes: { a: 20, l: 10 } });
    expect(gastoAlFormulario(repartida, viajeros, "EUR")).toMatchObject({ porImportes: true, importes: { a: "20", l: "10" } });
  });
});
