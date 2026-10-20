import { describe, it, expect } from "vitest";
import { datosDeTarjeta, altoDeTarjeta, recortar, MAX_PAGOS, ANCHO, ALTO_FILA } from "./tarjeta";

const personas = [
  { nombre: "Ana", tocaPagar: 30 },
  { nombre: "Luis", tocaPagar: 30 },
  { nombre: "Eva", tocaPagar: 30 },
];
const gastos = [
  { fecha: "2026-07-03" },
  { fecha: "2026-07-05" },
];

function datos(pagos) {
  return datosDeTarjeta({ nombre: "Lisboa", total: 90, personas, pagos, moneda: "EUR", gastos });
}

describe("datosDeTarjeta", () => {
  it("el total, las fechas y lo que sale por cabeza", () => {
    const d = datos([]);
    expect(d.total).toBe("90.00 €");
    expect(d.cuando).toBe("Del 3 al 5 de julio de 2026");
    expect(d.detalle).toBe("2 gastos · 3 viajeros · 30.00 € por cabeza");
  });

  it("solo los pagos que quedan, con su cantidad escrita", () => {
    const d = datos([
      { de: "Luis", a: "Ana", cantidad: 14 },
      { de: "Eva", a: "Ana", cantidad: 3, saldado: true },
    ]);
    expect(d.pagos).toEqual([{ de: "Luis", a: "Ana", cantidad: "14.00 €" }]);
    expect(d.estado).toBe("pendiente");
  });

  it("si ya está todo pagado, lo dice", () => {
    expect(datos([{ de: "Luis", a: "Ana", cantidad: 14, saldado: true }]).estado).toBe("pagado");
  });

  it("sin deudas, estáis a cero", () => {
    expect(datos([]).estado).toBe("a-cero");
  });

  it("con muchos pagos, los primeros y cuántos más", () => {
    const pagos = Array.from({ length: MAX_PAGOS + 3 }, (_, i) => ({ de: `P${i}`, a: "Ana", cantidad: 1 }));
    const d = datos(pagos);
    expect(d.pagos).toHaveLength(MAX_PAGOS);
    expect(d.masPagos).toBe(3);
  });

  it("en singular con uno solo", () => {
    const d = datosDeTarjeta({
      nombre: "Cena",
      total: 20,
      personas: [{ nombre: "Ana" }],
      pagos: [],
      moneda: "EUR",
      gastos: [{ fecha: "2026-07-03" }],
    });
    expect(d.detalle).toBe("1 gasto · 1 viajero");
  });
});

describe("altoDeTarjeta", () => {
  it("cuadrada como poco", () => {
    expect(altoDeTarjeta(datos([]))).toBe(ANCHO);
  });

  it("crece con los pagos", () => {
    const pagos = Array.from({ length: MAX_PAGOS }, (_, i) => ({ de: `P${i}`, a: "Ana", cantidad: 1 }));
    const pocos = altoDeTarjeta(datos(pagos.slice(0, 4)));
    const muchos = altoDeTarjeta(datos(pagos));
    expect(muchos - pocos).toBe(2 * ALTO_FILA);
  });
});

describe("recortar", () => {
  // Cada letra, 10 de ancho.
  const medir = (t) => Array.from(t).length * 10;

  it("si cabe, tal cual", () => {
    expect(recortar("Lisboa", 100, medir)).toBe("Lisboa");
  });

  it("si no, con puntos suspensivos y sin espacio colgando", () => {
    expect(recortar("Fin de semana en Lisboa", 100, medir)).toBe("Fin de se…");
    expect(recortar("Fin de semana", 70, medir)).toBe("Fin de…");
  });

  it("no parte los emojis", () => {
    expect(recortar("🏖️🏖️🏖️🏖️", 30, medir)).not.toContain("�");
  });
});
