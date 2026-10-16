import { describe, it, expect } from "vitest";
import { ordenarGastos, ordenGuardado, ordenesPara, ORDENES, POR_DIAS } from "./ordenar";
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

  it("primeros apuntados: como se fue apuntando, con los que no traen hora delante", () => {
    const apuntados = [
      { id: "cena", fecha: "2026-10-10", creadoEn: "2026-10-10T21:00:00Z" },
      { id: "taxi", fecha: "2026-10-12", creadoEn: "2026-10-12T09:00:00Z" },
      { id: "comida", fecha: "2026-10-10", creadoEn: "2026-10-13T08:00:00Z" },
      { id: "viejo", fecha: "2026-10-09" },
      { id: "otro-viejo", fecha: "2026-10-11" },
    ];

    expect(ids(ordenarGastos(apuntados, "antiguos", viajeros))).toEqual(["viejo", "otro-viejo", "cena", "taxi", "comida"]);
  });

  it("por concepto: de la A a la Z, sin liarse con tildes, mayúsculas ni números", () => {
    const conConcepto = [
      { id: 1, concepto: "taxi", importe: 10 },
      { id: 2, concepto: "Menú 10", importe: 12 },
      { id: 3, concepto: "Ópera", importe: 40 },
      { id: 4, concepto: "Menú 2", importe: 12 },
      { id: 5, concepto: "Taxi", importe: 25 },
      { id: 6, concepto: "agua", importe: 1 },
    ];
    expect(ids(ordenarGastos(conConcepto, "concepto", viajeros))).toEqual([6, 4, 2, 3, 5, 1]);
  });

  it("por categoría: como salen al apuntar y los más caros primero en cada una", () => {
    const conCategoria = [
      { id: 1, categoria: "ocio", importe: 20 },
      { id: 2, categoria: "comida", importe: 10 },
      // De los de antes, sin categoría: van con los de "otros".
      { id: 3, importe: 5 },
      { id: 4, categoria: "comida", importe: 30 },
      { id: 5, categoria: "otros", importe: 8 },
      // Una que ya no existe, también a "otros".
      { id: 6, categoria: "rara", importe: 1 },
      { id: 7, categoria: "transporte", importe: 100, moneda: "USD", importeConvertido: 92 },
    ];
    expect(ids(ordenarGastos(conCategoria, "categoria", viajeros))).toEqual([4, 2, 7, 1, 5, 3, 6]);
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

describe("lo que más me toca", () => {
  const tres = [
    { id: "a", nombre: "Ana" },
    { id: "b", nombre: "Luis" },
    { id: "c", nombre: "Marta" },
  ];
  const cuentas = [
    // 90 entre los tres: 30 cada uno.
    { id: 1, pagadorId: "a", importe: 90 },
    // 50 entre Ana y Luis: 25.
    { id: 2, pagadorId: "b", importe: 50, participantes: ["a", "b"] },
    // 40 con Ana a doble: 20 / 10 / 10. A Luis le toca 10.
    { id: 3, pagadorId: "c", importe: 40, participantes: ["a", "b", "c"], partes: { a: 2, b: 1, c: 1 } },
    // Solo de Marta: a Ana no le toca nada.
    { id: 4, pagadorId: "c", importe: 200, participantes: ["c"] },
    // En dólares, cuenta lo convertido: 36 entre los tres, 12.
    { id: 5, pagadorId: "a", importe: 40, moneda: "USD", importeConvertido: 36 },
  ];

  it("de lo que más me cuesta a lo que menos, y lo que no es mío al final", () => {
    expect(ids(ordenarGastos(cuentas, "mio", tres, "a"))).toEqual([1, 2, 3, 5, 4]);
  });

  it("depende de quién seas", () => {
    expect(ids(ordenarGastos(cuentas, "mio", tres, "c"))).toEqual([4, 1, 5, 3, 2]);
  });

  it("si te toca lo mismo, el más caro arriba", () => {
    const iguales = [
      { id: 1, pagadorId: "a", importe: 30, participantes: ["a", "b"] },
      { id: 2, pagadorId: "a", importe: 45, participantes: ["a", "b", "c"] },
    ];
    expect(ids(ordenarGastos(iguales, "mio", tres, "a"))).toEqual([2, 1]);
  });

  it("sin saber quién eres, no ordena", () => {
    expect(ordenarGastos(cuentas, "mio", tres, null)).toBe(cuentas);
  });

  it("solo se ofrece si sabemos quién eres", () => {
    expect(ordenesPara(true).map((o) => o.id)).toContain("mio");
    expect(ordenesPara(false).map((o) => o.id)).not.toContain("mio");
    expect(ordenesPara(false)).toHaveLength(ORDENES.length - 1);
  });
});
