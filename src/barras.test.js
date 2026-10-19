import { describe, it, expect } from "vitest";
import { gastoPorDia, topeRedondo, diasConEtiqueta, etiquetasConHoy } from "./barras";

const gastos = [
  { importe: 40, fecha: "2026-09-10" },
  { importe: 20, fecha: "2026-09-10" },
  { importe: 30, fecha: "2026-09-13" },
  { importe: 300, importeConvertido: 25, fecha: "2026-09-11" },
];

describe("gastoPorDia", () => {
  it("un día por barra, en orden, con los vacíos a cero", () => {
    expect(gastoPorDia(gastos)).toEqual([
      { fecha: "2026-09-10", total: 60, gastos: 2 },
      { fecha: "2026-09-11", total: 25, gastos: 1 },
      { fecha: "2026-09-12", total: 0, gastos: 0 },
      { fecha: "2026-09-13", total: 30, gastos: 1 },
    ]);
  });

  it("cruza bien de un mes a otro y el cambio de hora", () => {
    const dias = gastoPorDia([
      { importe: 1, fecha: "2026-10-24" },
      { importe: 1, fecha: "2026-10-27" },
    ]);
    expect(dias.map((d) => d.fecha)).toEqual(["2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27"]);
  });

  it("los gastos sin fecha, de antes, se quedan fuera", () => {
    expect(gastoPorDia([{ importe: 10 }, { importe: 5, fecha: "2026-09-10" }])).toEqual([
      { fecha: "2026-09-10", total: 5, gastos: 1 },
    ]);
  });

  it("sin gastos con fecha, nada", () => {
    expect(gastoPorDia([])).toEqual([]);
    expect(gastoPorDia([{ importe: 10 }])).toEqual([]);
  });
});

describe("topeRedondo", () => {
  it("sube al siguiente número redondo", () => {
    expect(topeRedondo(87)).toBe(100);
    expect(topeRedondo(160)).toBe(200);
    expect(topeRedondo(210)).toBe(250);
    expect(topeRedondo(420)).toBe(500);
    expect(topeRedondo(7.3)).toBe(10);
  });

  it("si ya es redondo, se queda", () => {
    expect(topeRedondo(50)).toBe(50);
    expect(topeRedondo(1000)).toBe(1000);
  });

  it("sin nada, uno, para no dividir entre cero", () => {
    expect(topeRedondo(0)).toBe(1);
  });
});

describe("diasConEtiqueta", () => {
  it("si caben, todos", () => {
    expect(diasConEtiqueta(4)).toEqual([0, 1, 2, 3]);
  });

  it("con muchos, el primero, el último y repartidos", () => {
    const elegidos = diasConEtiqueta(30);
    expect(elegidos[0]).toBe(0);
    expect(elegidos[elegidos.length - 1]).toBe(29);
    expect(elegidos.length).toBeLessThanOrEqual(6);
  });

  it("el penúltimo no se pega al último", () => {
    for (const cuantos of [7, 8, 9, 12, 15, 30]) {
      const elegidos = diasConEtiqueta(cuantos);
      const [penultimo, ultimo] = elegidos.slice(-2);
      expect(ultimo - penultimo).toBeGreaterThan(1);
    }
  });
});

describe("etiquetasConHoy", () => {
  const delMes = (cuantos) =>
    Array.from({ length: cuantos }, (_, i) => ({ fecha: `2026-10-${String(i + 1).padStart(2, "0")}` }));

  it("si hoy no está en la gráfica, como siempre", () => {
    expect(etiquetasConHoy(delMes(4), "2026-11-20")).toEqual({ elegidos: [0, 1, 2, 3], iHoy: -1 });
  });

  it("con pocos días, todos y se sabe cuál es hoy", () => {
    expect(etiquetasConHoy(delMes(4), "2026-10-03")).toEqual({ elegidos: [0, 1, 2, 3], iHoy: 2 });
  });

  it("con muchos, hoy entra aunque no tocara, y se van las que tiene pegadas", () => {
    // Sin hoy serían 0, 6, 12, 18 y 29: el 12 y el 18 le quedan pegados.
    const { elegidos, iHoy } = etiquetasConHoy(delMes(30), "2026-10-14");
    expect(iHoy).toBe(13);
    expect(elegidos).toEqual([0, 6, 13, 29]);
  });

  it("si hoy es el último, se queda en su sitio", () => {
    const { elegidos } = etiquetasConHoy(delMes(30), "2026-10-30");
    expect(elegidos).toEqual([0, 6, 12, 18, 29]);
  });
});
