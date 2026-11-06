import { describe, it, expect } from "vitest";
import { agrupar, frase, filasQueSeEntienden } from "./actividad";

const viajeros = [
  { id: "a", nombre: "Ana" },
  { id: "l", nombre: "Luis" },
];
let n = 0;
const fila = (que, quien, sobre, creadoEn, importe = null) => ({ id: ++n, que, quien, sobre, importe, moneda: "EUR", creadoEn });

describe("frase", () => {
  it("un gasto, con su importe", () => {
    const [g] = agrupar([fila("gasto_nuevo", "l", "Cena", "2026-11-06T20:00:00Z", 45)]);
    expect(frase(g, viajeros, null)).toBe("Luis apuntó Cena (45.00 €)");
  });

  it("si fuiste tú, en segunda persona", () => {
    const [g] = agrupar([fila("gasto_borrado", "l", "Taxi", "2026-11-06T20:00:00Z", 12)]);
    expect(frase(g, viajeros, "l")).toBe("Tú borraste Taxi (12.00 €)");
  });

  it("sin saber quién, alguien", () => {
    const [g] = agrupar([fila("gasto_cambiado", null, "Hotel", "2026-11-06T20:00:00Z", 300)]);
    expect(frase(g, viajeros, null)).toBe("Alguien cambió Hotel (300.00 €)");
  });

  it("viajeros y pagos, sin importe", () => {
    const [v] = agrupar([fila("viajero_nuevo", "a", "Hugo", "2026-11-06T20:00:00Z")]);
    expect(frase(v, viajeros, null)).toBe("Ana añadió a Hugo");
    const [p] = agrupar([fila("pago_saldado", "a", "Luis → Ana", "2026-11-06T20:00:00Z")]);
    expect(frase(p, viajeros, "a")).toBe("Tú diste por pagado lo de Luis a Ana");
  });

  it("en otra moneda, con la suya", () => {
    const [g] = agrupar([{ ...fila("gasto_nuevo", "a", "Sushi", "2026-11-06T20:00:00Z", 3000), moneda: "JPY" }]);
    expect(frase(g, viajeros, null, "EUR")).toMatch(/^Ana apuntó Sushi \(3000/);
  });
});

describe("agrupar", () => {
  it("lo que se hace de golpe, en una", () => {
    const filas = [
      fila("gasto_borrado", "a", "Cena", "2026-11-06T20:00:30Z", 1),
      fila("gasto_borrado", "a", "Taxi", "2026-11-06T20:00:20Z", 1),
      fila("gasto_borrado", "a", "Museo", "2026-11-06T20:00:10Z", 1),
    ];
    const grupos = agrupar(filas);
    expect(grupos).toHaveLength(1);
    expect(frase(grupos[0], viajeros, null)).toBe("Ana borró 3 gastos");
  });

  it("no junta si es otro, otra cosa o mucho después", () => {
    const filas = [
      fila("gasto_nuevo", "a", "Cena", "2026-11-06T20:00:00Z", 1),
      fila("gasto_nuevo", "l", "Taxi", "2026-11-06T19:59:50Z", 1),
      fila("gasto_borrado", "l", "Museo", "2026-11-06T19:59:40Z", 1),
      fila("gasto_borrado", "l", "Café", "2026-11-06T19:50:00Z", 1),
    ];
    expect(agrupar(filas)).toHaveLength(4);
  });

  it("los viajeros quitados de golpe, también", () => {
    const filas = [
      fila("viajero_quitado", "a", "Hugo", "2026-11-06T20:00:01Z"),
      fila("viajero_quitado", "a", "Eva", "2026-11-06T20:00:00Z"),
    ];
    expect(frase(agrupar(filas)[0], viajeros, null)).toBe("Ana quitó a 2 viajeros");
  });

  it("los cambios no se juntan, cada uno es de un gasto distinto", () => {
    const filas = [
      fila("gasto_cambiado", "a", "Cena", "2026-11-06T20:00:10Z", 1),
      fila("gasto_cambiado", "a", "Taxi", "2026-11-06T20:00:00Z", 1),
    ];
    expect(agrupar(filas)).toHaveLength(2);
  });

  it("lo que no entiende, fuera", () => {
    const rara = fila("algo_nuevo", "a", "?", "2026-11-06T20:00:00Z");
    expect(filasQueSeEntienden([rara])).toEqual([]);
    expect(agrupar([rara])).toEqual([]);
  });
});
