import { describe, it, expect } from "vitest";
import { esDeSplitwise, gastosDeSplitwise } from "./splitwise";
import { calcularBalances } from "./calculos";

const viajeros = [
  { id: "a", nombre: "Ana" },
  { id: "l", nombre: "Luis" },
  { id: "m", nombre: "Marta" },
];

const CSV = [
  "Date,Description,Category,Cost,Currency,Ana,Luís,marta",
  "2026-10-03,Dinner,Dining out,60.00,EUR,40.00,-20.00,-20.00",
  '2026-10-03,"Taxi, aeropuerto",Taxi,10.00,EUR,-3.33,6.67,-3.34',
  "2026-10-04,Hotel,Hotel,90.00,EUR,-60.00,30.00,30.00",
  "2026-10-04,Helado,General,9.00,EUR,6.00,-6.00,0.00",
  "2026-10-05,Payment,Payment,20.00,EUR,-20.00,20.00,0.00",
  "2026-10-05,Souvenir,General,15.00,GBP,7.50,-7.50,0.00",
  ",Total balance,,,EUR,-29.83,23.17,6.66",
].join("\n");

describe("esDeSplitwise", () => {
  it("lo reconoce por la cabecera, con o sin BOM", () => {
    expect(esDeSplitwise(CSV)).toBe(true);
    expect(esDeSplitwise("\uFEFF" + CSV)).toBe(true);
  });

  it("una lista de las notas no lo es", () => {
    expect(esDeSplitwise("cena 45 ana\ntaxi 12 luis")).toBe(false);
  });
});

describe("gastosDeSplitwise", () => {
  const { gastos, sinEntender, faltan } = gastosDeSplitwise(CSV, viajeros, "EUR");

  it("encuentra a cada uno por el nombre, aunque lleve tilde o minúscula", () => {
    expect(faltan).toEqual([]);
  });

  it("uno paga y se reparte a partes iguales", () => {
    expect(gastos[0]).toMatchObject({ pagadorId: "a", importe: 60, concepto: "Dinner", fecha: "2026-10-03", categoria: "comida", partes: null });
    expect(gastos[0].participantes.sort()).toEqual(["a", "l", "m"]);
  });

  it("las comas entre comillas no parten la descripción", () => {
    expect(gastos[1].concepto).toBe("Taxi, aeropuerto");
    expect(gastos[1].partes).toBeNull();
  });

  it("si solo es de algunos, solo van esos", () => {
    expect(gastos[3]).toMatchObject({ pagadorId: "a", importe: 9, participantes: ["a", "l"] });
  });

  it("un pago entre vosotros entra como un gasto de uno para el otro", () => {
    expect(gastos[4]).toMatchObject({ pagadorId: "l", importe: 20, participantes: ["a"] });
  });

  it("pagado entre varios, apunta lo que movió dinero", () => {
    expect(gastos[2]).toMatchObject({ importe: 60, pagadores: { l: 3000, m: 3000 }, participantes: ["a"] });
  });

  it("lo de otra moneda se queda fuera y lo dice; el total ni se nombra", () => {
    expect(sinEntender).toEqual(["Souvenir"]);
    expect(gastos).toHaveLength(5);
  });

  it("las cuentas quedan como en Splitwise, quitando lo que se queda fuera", () => {
    const balances = calcularBalances(viajeros, gastos);
    const de = (id) => Math.round(balances.find((b) => b.id === id).balance * 100) / 100;
    // El total de Splitwise menos el souvenir en libras (+7,50 Ana, −7,50 Luis).
    // Un céntimo arriba o abajo: el taxi de 10 entre 3 aquí va a partes iguales,
    // y Splitwise le cargó el céntimo que sobra a Marta.
    const casi = (real, esperado) => expect(Math.abs(real - esperado)).toBeLessThanOrEqual(0.011);
    casi(de("a"), -29.83 - 7.5);
    casi(de("l"), 23.17 + 7.5);
    casi(de("m"), 6.66);
  });

  it("a partes desiguales, con las partes de cada uno", () => {
    const csv = "Date,Description,Category,Cost,Currency,Ana,Luis\n2026-10-03,Cena,Dining out,30.00,EUR,10.00,-10.00";
    const [g] = gastosDeSplitwise(csv, viajeros).gastos;
    expect(g.partes).toEqual({ a: 2000, l: 1000 });
  });

  it("si en Splitwise hay alguien que aquí no está, lo dice y no apunta nada", () => {
    const csv = "Date,Description,Category,Cost,Currency,Ana,Pedro\n2026-10-03,Cena,Dining out,30.00,EUR,15.00,-15.00";
    expect(gastosDeSplitwise(csv, viajeros)).toEqual({ gastos: [], sinEntender: [], faltan: ["Pedro"] });
  });

  it("con las columnas de notas y recibo, esas no son personas", () => {
    const csv = "Date,Description,Category,Cost,Currency,Details,Receipt Link,Ana,Luis\n2026-10-03,Cena,Dining out,30.00,EUR,con vino,,15.00,-15.00";
    const { gastos: [g], faltan: nadie } = gastosDeSplitwise(csv, viajeros);
    expect(nadie).toEqual([]);
    expect(g.nota).toBe("con vino");
  });
});
