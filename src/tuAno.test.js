import { describe, it, expect } from "vitest";
import { loTuyo, conLoTuyo, tuAno, textoTuAno } from "./tuAno";

const viaje = {
  viajeros: [
    { id: "a", nombre: "Ana" },
    { id: "l", nombre: "Luis" },
  ],
  gastos: [
    { id: 1, pagadorId: "a", importe: 90, participantes: ["a", "l"], fecha: "2026-03-02" },
    { id: 2, pagadorId: "l", importe: 30, participantes: ["a", "l"], partes: { a: 2, l: 1 }, fecha: "2026-03-01" },
  ],
};

describe("loTuyo", () => {
  it("lo que te tocó a ti, no lo que pusiste, y el año del primer gasto", () => {
    expect(loTuyo(viaje, "a")).toEqual({ tuyo: 65, ano: 2026 });
    expect(loTuyo(viaje, "l")).toEqual({ tuyo: 55, ano: 2026 });
  });

  it("sin saber quién eres, o sin gastos, nada", () => {
    expect(loTuyo(viaje, null)).toBeNull();
    expect(loTuyo(viaje, "x")).toBeNull();
    expect(loTuyo({ ...viaje, gastos: [] }, "a")).toBeNull();
  });

  it("un viaje de Nochevieja es del año en que empezó", () => {
    const nochevieja = { ...viaje, gastos: [{ ...viaje.gastos[0], fecha: "2026-01-01" }, { ...viaje.gastos[1], fecha: "2025-12-31" }] };
    expect(loTuyo(nochevieja, "a").ano).toBe(2025);
  });
});

describe("conLoTuyo", () => {
  const lista = [{ codigo: "A", nombre: "Lisboa" }, { codigo: "B", nombre: "Roma" }];

  it("lo apunta en su viaje", () => {
    expect(conLoTuyo(lista, "A", { tuyo: 65, ano: 2026 })[0]).toEqual({ codigo: "A", nombre: "Lisboa", tuyo: 65, ano: 2026 });
  });

  it("si no cambia, o el viaje no está, null", () => {
    expect(conLoTuyo([{ codigo: "A", tuyo: 65, ano: 2026 }], "A", { tuyo: 65, ano: 2026 })).toBeNull();
    expect(conLoTuyo(lista, "Z", { tuyo: 1, ano: 2026 })).toBeNull();
    expect(conLoTuyo(lista, "A", null)).toBeNull();
  });
});

describe("tuAno", () => {
  const lista = [
    { codigo: "A", nombre: "Lisboa", moneda: "EUR", tuyo: 410, ano: 2026 },
    { codigo: "B", nombre: "Oporto", moneda: "EUR", tuyo: 250.5, ano: 2026 },
    { codigo: "C", nombre: "Londres", moneda: "GBP", tuyo: 150, ano: 2026 },
    { codigo: "D", nombre: "Roma", moneda: "EUR", tuyo: 900, ano: 2025 },
    { codigo: "E", nombre: "Sin saber quién soy", moneda: "EUR", ano: 2026 },
  ];

  it("cuenta los del año, con cada moneda por su lado", () => {
    expect(tuAno(lista, 2026)).toEqual({
      ano: 2026,
      viajes: 3,
      porMoneda: [
        { moneda: "EUR", cifra: 660.5 },
        { moneda: "GBP", cifra: 150 },
      ],
      masCaro: { nombre: "Lisboa", tuyo: 410, moneda: "EUR" },
    });
  });

  it("con uno solo ese año, nada", () => {
    expect(tuAno(lista, 2025)).toBeNull();
  });

  it("los guardados de antes no traen lo tuyo y no cuentan", () => {
    expect(tuAno([{ nombre: "Viejo", ano: 2026 }, { nombre: "Otro", ano: 2026 }], 2026)).toBeNull();
  });
});

describe("textoTuAno", () => {
  it("las tres líneas", () => {
    const texto = textoTuAno({ ano: 2026, viajes: 3, porMoneda: [{ moneda: "EUR", cifra: 660.5 }, { moneda: "GBP", cifra: 150 }], masCaro: { nombre: "Lisboa", tuyo: 410, moneda: "EUR" } });
    expect(texto.titulo).toBe("En 2026, 3 viajes");
    expect(texto.cifra).toMatch(/^Te han tocado 660,50 € y .*150.00/);
    expect(texto.masCaro).toBe("El más caro, Lisboa: 410,00 €");
  });

  it("sin resumen, nada", () => {
    expect(textoTuAno(null)).toBeNull();
  });
});
