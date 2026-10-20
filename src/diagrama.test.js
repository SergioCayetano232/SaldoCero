import { describe, it, expect } from "vitest";
import { diagramaDeDeudas, puntoDeCurva, caminoDeFlecha, hayDiagrama, FILA, RADIO } from "./diagrama";

const pago = (de, a, cantidad, saldado = false) => ({ de, a, deId: de, aId: a, cantidad, saldado });

describe("diagramaDeDeudas", () => {
  it("los que deben a la izquierda y los que cobran a la derecha", () => {
    const d = diagramaDeDeudas([pago("Luis", "Ana", 20), pago("Eva", "Ana", 10)]);
    expect(d.deben.map((p) => p.nombre)).toEqual(["Luis", "Eva"]);
    expect(d.cobran.map((p) => p.nombre)).toEqual(["Ana"]);
    expect(d.deben[0].x).toBeLessThan(d.cobran[0].x);
  });

  it("la columna corta va centrada con la larga", () => {
    const d = diagramaDeDeudas([pago("Luis", "Ana", 20), pago("Eva", "Ana", 10)]);
    expect(d.cobran[0].y).toBe((d.deben[0].y + d.deben[1].y) / 2);
    expect(d.deben[1].y - d.deben[0].y).toBe(FILA);
  });

  it("los pagados no salen", () => {
    const d = diagramaDeDeudas([pago("Luis", "Ana", 20), pago("Eva", "Ana", 10, true)]);
    expect(d.deben.map((p) => p.nombre)).toEqual(["Luis"]);
    expect(d.flechas).toHaveLength(1);
  });

  it("más dinero, flecha más gorda", () => {
    const d = diagramaDeDeudas([pago("Luis", "Ana", 40), pago("Eva", "Ana", 10)]);
    expect(d.flechas[0].grosor).toBeGreaterThan(d.flechas[1].grosor);
  });

  it("la flecha llega antes del círculo", () => {
    const d = diagramaDeDeudas([pago("Luis", "Ana", 40)]);
    expect(d.flechas[0].hasta.x).toBeLessThan(d.cobran[0].x - RADIO);
  });

  it("las cifras no se pisan", () => {
    // En escalera, que es como salen siempre los pagos: uno paga a dos, y el
    // segundo de esos cobra de otros dos.
    const d = diagramaDeDeudas([
      pago("Luis", "Ana", 20),
      pago("Luis", "Pepe", 5),
      pago("Eva", "Pepe", 10),
      pago("Marta", "Pepe", 4),
      pago("Marta", "Rosa", 3),
    ]);
    const etiquetas = d.flechas.map((f) => f.etiqueta);
    const lejos = (a, b) => Math.abs(a.x - b.x) >= d.etiqueta.ancho || Math.abs(a.y - b.y) >= d.etiqueta.alto;

    etiquetas.forEach((a, i) => etiquetas.slice(i + 1).forEach((b) => expect(lejos(a, b)).toBe(true)));
  });

  it("las que llegan al mismo se abren en abanico", () => {
    const d = diagramaDeDeudas([pago("Luis", "Ana", 20), pago("Eva", "Ana", 10), pago("Marta", "Ana", 5)]);
    const llegadas = d.flechas.map((f) => f.hasta.y);
    expect(new Set(llegadas).size).toBe(3);
    // Por orden, y repartidas alrededor del centro de Ana.
    expect(llegadas[0]).toBeLessThan(llegadas[1]);
    expect(llegadas[1]).toBe(d.cobran[0].y);
    expect(Math.abs(llegadas[2] - d.cobran[0].y)).toBeLessThan(RADIO);
  });

  it("sin pagos, vacío", () => {
    const d = diagramaDeDeudas([]);
    expect(d.flechas).toEqual([]);
  });
});

describe("puntoDeCurva", () => {
  it("empieza, acaba y pasa por el medio", () => {
    const desde = { x: 0, y: 0 };
    const hasta = { x: 100, y: 50 };
    expect(puntoDeCurva(desde, hasta, 0)).toEqual(desde);
    expect(puntoDeCurva(desde, hasta, 1)).toEqual(hasta);
    expect(puntoDeCurva(desde, hasta, 0.5)).toEqual({ x: 50, y: 25 });
  });
});

describe("caminoDeFlecha", () => {
  it("una curva que sale y llega en horizontal", () => {
    expect(caminoDeFlecha({ desde: { x: 0, y: 10 }, hasta: { x: 100, y: 60 } })).toBe("M 0 10 C 50 10, 50 60, 100 60");
  });
});

describe("hayDiagrama", () => {
  it("con dos pagos o más que queden", () => {
    expect(hayDiagrama([pago("Luis", "Ana", 1)])).toBe(false);
    expect(hayDiagrama([pago("Luis", "Ana", 1), pago("Eva", "Ana", 1, true)])).toBe(false);
    expect(hayDiagrama([pago("Luis", "Ana", 1), pago("Eva", "Ana", 1)])).toBe(true);
  });
});
