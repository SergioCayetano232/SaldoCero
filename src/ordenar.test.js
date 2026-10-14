import { describe, it, expect } from "vitest";
import { ordenarGastos, ordenGuardado, ORDENES, POR_DIAS } from "./ordenar";
import { BOTE } from "./bote";

const viajeros = [
  { id: "l", nombre: "Luis" },
  { id: "a", nombre: "Ana" },
  { id: "o", nombre: "Óscar" },
];

const gastos = [
  { id: 1, pagadorId: "l", importe: 20 },
  { id: 2, pagadorId: BOTE, importe: 300 },
  { id: 3, pagadorId: "a", importe: 15 },
  // En dólares: cuenta lo convertido, no lo que pone.
  { id: 4, pagadorId: "l", importe: 100, moneda: "USD", importeConvertido: 92 },
  { id: 5, pagadorId: "o", importe: 50 },
  { id: 6, pagadorId: "se-fue", importe: 10 },
  { id: 7, pagadorId: "a", importe: 40 },
];

const ids = (lista) => lista.map((g) => g.id);

describe("ordenarGastos", () => {
  it("por días los deja como están", () => {
    expect(ordenarGastos(gastos, POR_DIAS, viajeros)).toBe(gastos);
  });

  it("más caros, en la moneda del viaje", () => {
    expect(ids(ordenarGastos(gastos, "importe", viajeros))).toEqual([2, 4, 5, 7, 1, 3, 6]);
  });

  it("más baratos, también en la moneda del viaje", () => {
    expect(ids(ordenarGastos(gastos, "baratos", viajeros))).toEqual([6, 3, 1, 7, 5, 4, 2]);
  });

  it("un orden guardado de más baratos se respeta", () => {
    expect(ordenGuardado("baratos")).toBe("baratos");
  });

  it("por quién pagó: por nombre, sin liarse con las tildes, y el bote al final", () => {
    expect(ids(ordenarGastos(gastos, "pagador", viajeros))).toEqual([7, 3, 4, 1, 5, 2, 6]);
  });

  it("últimos apuntados: lo último arriba, aunque sea de otro día", () => {
    const apuntados = [
      { id: "cena", fecha: "2026-10-10", creadoEn: "2026-10-10T21:00:00Z" },
      { id: "taxi", fecha: "2026-10-12", creadoEn: "2026-10-12T09:00:00Z" },
      // La comida del primer día, apuntada tarde.
      { id: "comida", fecha: "2026-10-10", creadoEn: "2026-10-13T08:00:00Z" },
      // Sin la hora en que se apuntó, al final.
      { id: "viejo", fecha: "2026-10-09" },
    ];

    expect(ids(ordenarGastos(apuntados, "recientes", viajeros))).toEqual(["comida", "taxi", "cena", "viejo"]);
  });

  it("no toca la lista de fuera", () => {
    const copia = [...gastos];
    ordenarGastos(gastos, "importe", viajeros);
    expect(gastos).toEqual(copia);
  });

  it("con un orden que no conoce, como por días", () => {
    expect(ordenarGastos(gastos, "raro", viajeros)).toBe(gastos);
  });

  it("los órdenes tienen nombre y el primero es por días", () => {
    expect(ORDENES[0].id).toBe(POR_DIAS);
    for (const o of ORDENES) expect(o.nombre).toBeTruthy();
  });
});

describe("ordenGuardado", () => {
  it("el que había, si existe", () => {
    expect(ordenGuardado("importe")).toBe("importe");
    expect(ordenGuardado("pagador")).toBe("pagador");
  });

  it("sin nada guardado, por días", () => {
    expect(ordenGuardado(null)).toBe(POR_DIAS);
    expect(ordenGuardado(undefined)).toBe(POR_DIAS);
  });

  it("uno que ya no existe, por días", () => {
    expect(ordenGuardado("alfabetico")).toBe(POR_DIAS);
    expect(ordenGuardado(42)).toBe(POR_DIAS);
  });
});
