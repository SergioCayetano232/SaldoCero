import { describe, it, expect } from "vitest";
import { evolucionDeSaldos, conSigno, diaEn } from "./evolucion";
import { BOTE } from "./bote";

const viajeros = [
  { id: "ana", nombre: "Ana" },
  { id: "luis", nombre: "Luis" },
];

const gasto = (pagadorId, importe, fecha) => ({ pagadorId, importe, fecha, participantes: ["ana", "luis"] });

describe("evolucionDeSaldos", () => {
  it("el saldo de cada uno al final de cada día", () => {
    const e = evolucionDeSaldos(viajeros, [gasto("ana", 100, "2026-07-01"), gasto("luis", 60, "2026-07-02")]);
    expect(e.dias).toEqual(["2026-07-01", "2026-07-02"]);
    // Día 1: Ana adelanta 100, le deben 50. Día 2: Luis pone 60, le deben 30 menos a Ana.
    expect(e.series[0].saldos).toEqual([50, 20]);
    expect(e.series[1].saldos).toEqual([-50, -20]);
  });

  it("los días sin gastos también salen, igual que el anterior", () => {
    const e = evolucionDeSaldos(viajeros, [gasto("ana", 100, "2026-07-01"), gasto("luis", 100, "2026-07-03")]);
    expect(e.dias).toHaveLength(3);
    expect(e.series[0].saldos).toEqual([50, 50, 0]);
  });

  it("el tope es el saldo más grande, y vale para todos", () => {
    const e = evolucionDeSaldos(viajeros, [gasto("ana", 120, "2026-07-01"), gasto("luis", 60, "2026-07-02")]);
    expect(e.tope).toBe(60);
  });

  it("si todos van a cero, el tope no es cero", () => {
    const e = evolucionDeSaldos(viajeros, [gasto("ana", 10, "2026-07-01"), gasto("luis", 10, "2026-07-02")]);
    expect(e.tope).toBe(5);
    const nada = evolucionDeSaldos(viajeros, [
      { ...gasto("ana", 10, "2026-07-01"), participantes: ["ana"] },
      { ...gasto("luis", 10, "2026-07-02"), participantes: ["luis"] },
    ]);
    expect(nada.tope).toBe(1);
  });

  it("los gastos sin fecha cuentan desde el primer día", () => {
    const e = evolucionDeSaldos(viajeros, [
      { pagadorId: "luis", importe: 20, participantes: ["ana", "luis"] },
      gasto("ana", 100, "2026-07-01"),
      gasto("ana", 10, "2026-07-02"),
    ]);
    expect(e.series[0].saldos).toEqual([40, 45]);
  });

  it("con bote, lo que pone cada uno cuenta desde el principio", () => {
    const aportaciones = [
      { viajeroId: "ana", importe: 50 },
      { viajeroId: "luis", importe: 50 },
    ];
    const e = evolucionDeSaldos(
      viajeros,
      [gasto(BOTE, 40, "2026-07-01"), gasto(BOTE, 40, "2026-07-02")],
      aportaciones
    );
    // Del bote pagan los dos a medias: cada uno ha puesto 50 y le tocan 20, luego 40.
    expect(e.series[0].saldos).toEqual([30, 10]);
    expect(e.series.map((s) => s.nombre)).toEqual(["Ana", "Luis"]);
  });

  it("con un día o una persona, nada", () => {
    expect(evolucionDeSaldos(viajeros, [gasto("ana", 100, "2026-07-01")])).toBeNull();
    expect(evolucionDeSaldos([viajeros[0]], [gasto("ana", 1, "2026-07-01"), gasto("ana", 1, "2026-07-02")])).toBeNull();
  });
});

describe("conSigno", () => {
  const f = (n) => `${n.toFixed(2)} €`;

  it("más, menos de verdad, o cero sin signo", () => {
    expect(conSigno(40, f)).toBe("+40.00 €");
    expect(conSigno(-60, f)).toBe("−60.00 €");
    expect(conSigno(0.001, f)).toBe("0.00 €");
  });
});

describe("diaEn", () => {
  it("el más cercano, sin salirse", () => {
    expect(diaEn(0, 5)).toBe(0);
    expect(diaEn(0.49, 5)).toBe(2);
    expect(diaEn(1, 5)).toBe(4);
    expect(diaEn(-0.2, 5)).toBe(0);
    expect(diaEn(1.3, 5)).toBe(4);
  });
});
