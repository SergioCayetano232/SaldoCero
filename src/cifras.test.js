import { describe, it, expect } from "vitest";
import { cifrasDelViaje, cifrasEnTexto } from "./cifras";
import { BOTE } from "./bote";

const personas = [
  { id: "a", nombre: "Ana", puesto: 150 },
  { id: "b", nombre: "Luis", puesto: 60 },
  { id: "c", nombre: "Marta", puesto: 30 },
];

const gastos = [
  { pagadorId: "a", importe: 120, concepto: "Hotel", categoria: "alojamiento", fecha: "2026-09-10" },
  { pagadorId: "b", importe: 40, concepto: "Cena", categoria: "comida", fecha: "2026-09-10" },
  { pagadorId: "a", importe: 30, concepto: "Museo", categoria: "ocio", fecha: "2026-09-11" },
  { pagadorId: "c", importe: 30, concepto: "Comida", categoria: "comida", fecha: "2026-09-12" },
  { pagadorId: "b", importe: 20, concepto: "Taxi", categoria: "transporte", fecha: "2026-09-12" },
];

describe("cifrasDelViaje", () => {
  const cifras = cifrasDelViaje(gastos, personas);

  it("total, gastos y días", () => {
    expect(cifras.total).toBe(240);
    expect(cifras.gastos).toBe(5);
    expect(cifras.dias).toBe(3);
  });

  it("la media por persona y día", () => {
    // 240 entre 3 personas y 3 días.
    expect(cifras.porPersonaYDia).toBeCloseTo(26.67);
  });

  it("el día más caro", () => {
    expect(cifras.diaMasCaro).toEqual({ fecha: "2026-09-10", total: 160 });
  });

  it("el gasto más gordo, con quién lo pagó", () => {
    expect(cifras.gastoMasGrande).toEqual({ concepto: "Hotel", importe: 120, quien: "Ana" });
  });

  it("quién puso más", () => {
    expect(cifras.quienMasPuso.nombre).toBe("Ana");
  });

  it("la categoría que más se llevó, con su porcentaje", () => {
    expect(cifras.categoria).toMatchObject({ id: "alojamiento", total: 120, porcentaje: 50 });
  });

  it("cuenta lo convertido, no lo que se pagó en otra moneda", () => {
    const enDirhams = [{ ...gastos[0], importe: 1300, importeConvertido: 120 }];
    expect(cifrasDelViaje(enDirhams, personas).total).toBe(120);
  });

  it("si lo pagó el bote, lo dice", () => {
    const delBote = [{ ...gastos[0], pagadorId: BOTE }];
    expect(cifrasDelViaje(delBote, personas).gastoMasGrande.quien).toBe("el bote");
  });

  it("si todos pusieron lo mismo, no hay ganador", () => {
    const iguales = personas.map((p) => ({ ...p, puesto: 80 }));
    expect(cifrasDelViaje(gastos, iguales).quienMasPuso).toBeNull();
  });

  it("con un solo día, ni día más caro ni media por día", () => {
    const unDia = gastos.slice(0, 2);
    const c = cifrasDelViaje(unDia, personas);
    expect(c.diaMasCaro).toBeNull();
    expect(c.porPersonaYDia).toBeNull();
  });

  it("los gastos sin fecha, de antes, no cuentan como día", () => {
    const sinFecha = gastos.map((g) => ({ ...g, fecha: undefined }));
    const c = cifrasDelViaje(sinFecha, personas);
    expect(c.dias).toBe(0);
    expect(c.diaMasCaro).toBeNull();
    expect(c.total).toBe(240);
  });

  it("sin gastos, nada", () => {
    expect(cifrasDelViaje([], personas)).toBeNull();
  });
});

describe("cifrasEnTexto", () => {
  const texto = cifrasEnTexto(cifrasDelViaje(gastos, personas), "Lisboa", "EUR");

  it("lleva el nombre y el total", () => {
    expect(texto).toContain("*Lisboa* en cifras");
    expect(texto).toContain("240.00 € en 5 gastos");
  });

  it("lleva cada cifra", () => {
    expect(texto).toContain("El que más puso: Ana, 150.00 €");
    expect(texto).toContain("El gasto más gordo: Hotel, 120.00 € (Ana)");
    expect(texto).toContain("alojamiento, el 50 %");
    expect(texto).toContain("26.67 € por persona y día");
  });

  it("lo que no hay, no sale", () => {
    const unDia = cifrasEnTexto(cifrasDelViaje(gastos.slice(0, 2), personas), "Lisboa", "EUR");
    expect(unDia).not.toContain("por persona y día");
    expect(unDia).not.toContain("día más caro");
  });
});
