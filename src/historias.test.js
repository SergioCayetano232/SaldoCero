import { describe, it, expect } from "vitest";
import { historiasDelViaje, siguienteHistoria } from "./historias";
import { cifrasDelViaje } from "./cifras";

const personas = [
  { id: "a", nombre: "Ana", puesto: 150 },
  { id: "b", nombre: "Luis", puesto: 60 },
  { id: "c", nombre: "Marta", puesto: 30 },
];

const gastos = [
  { pagadorId: "a", importe: 120, concepto: "Hotel", categoria: "alojamiento", fecha: "2026-09-10" },
  { pagadorId: "b", importe: 40, concepto: "Cena", categoria: "comida", fecha: "2026-09-10" },
  { pagadorId: "a", importe: 30, concepto: "Museo", categoria: "ocio", fecha: "2026-09-11" },
  { pagadorId: "c", importe: 30, concepto: "Café", categoria: "comida", fecha: "2026-09-12" },
  { pagadorId: "b", importe: 20, concepto: "Café", categoria: "comida", fecha: "2026-09-12" },
];

function historias(lista = gastos, pendientes = 2) {
  return historiasDelViaje(cifrasDelViaje(lista, personas, "EUR"), {
    nombre: "Lisboa",
    moneda: "EUR",
    gastos: lista,
    pendientes,
  });
}

const ids = (h) => h.map((x) => x.id);
const una = (h, id) => h.find((x) => x.id === id);

describe("historiasDelViaje", () => {
  it("empieza por el viaje y acaba en las cuentas", () => {
    const h = historias();
    expect(h[0]).toMatchObject({ cifra: "Lisboa", despues: "Del 10 al 12 de septiembre de 2026" });
    expect(h.at(-1).id).toBe("final");
  });

  it("el total con sus gastos y sus días", () => {
    expect(una(historias(), "total")).toMatchObject({ cifra: "240.00 €", despues: "en 5 gastos y 3 días" });
  });

  it("lo más gordo, con quién lo pagó", () => {
    expect(una(historias(), "grande")).toMatchObject({ cifra: "Hotel", despues: "120.00 €, y lo pagó Ana" });
  });

  it("lo que más se repitió", () => {
    expect(una(historias(), "repetido")).toMatchObject({ cifra: "Café", despues: "2 veces, 50.00 € en total" });
  });

  it("el día más caro, con su nombre entero", () => {
    expect(una(historias(), "dia-caro").cifra).toBe("jueves, 10 de septiembre");
  });

  it("si el que más veces pagó es el que más puso, no se repite", () => {
    // Ana pagó dos veces y es la que más puso; Luis también dos: empate, no sale.
    expect(ids(historias())).not.toContain("mas-veces");
  });

  it("lo que no hay, no sale", () => {
    const solo = [gastos[0]];
    const h = historias(solo);
    expect(ids(h)).not.toContain("por-dia");
    expect(ids(h)).not.toContain("dia-caro");
    expect(ids(h)).not.toContain("repetido");
    expect(una(h, "total").despues).toBe("en 1 gasto");
  });

  it("al final, lo que falta por pagar o que estáis a cero", () => {
    expect(una(historias(gastos, 1), "final").cifra).toBe("Falta 1 pago");
    expect(una(historias(gastos, 3), "final").cifra).toBe("Faltan 3 pagos");
    expect(una(historias(gastos, 0), "final").cifra).toBe("Estáis a cero");
  });

  it("sin cifras, nada", () => {
    expect(historiasDelViaje(null, {})).toEqual([]);
  });
});

describe("siguienteHistoria", () => {
  it("avanza y al final sale", () => {
    expect(siguienteHistoria(0, 3, false)).toBe(1);
    expect(siguienteHistoria(2, 3, false)).toBeNull();
  });

  it("hacia atrás, sin pasar de la primera", () => {
    expect(siguienteHistoria(2, 3, true)).toBe(1);
    expect(siguienteHistoria(0, 3, true)).toBe(0);
  });
});
