import { describe, it, expect } from "vitest";
import {
  participantesDeGasto,
  calcularTotal,
  calcularBalances,
  calcularLeTocaPagar,
  calcularPagos,
} from "./calculos";

const ana = { id: "a", nombre: "Ana" };
const luis = { id: "b", nombre: "Luis" };
const marta = { id: "c", nombre: "Marta" };
const viajeros = [ana, luis, marta];

// Un gasto, escrito corto para no repetir.
function gasto(pagadorId, importe, participantes) {
  return { id: `g${importe}`, pagadorId, importe, concepto: "X", participantes };
}

describe("participantesDeGasto", () => {
  it("devuelve solo los del gasto", () => {
    const suyos = participantesDeGasto(gasto("a", 30, ["a", "b"]), viajeros);
    expect(suyos.map((v) => v.nombre)).toEqual(["Ana", "Luis"]);
  });

  it("si el gasto no trae participantes, va entre todos", () => {
    // Los gastos de antes de que existiera el reparto.
    const suyos = participantesDeGasto({ importe: 30 }, viajeros);
    expect(suyos).toEqual(viajeros);
  });

  it("no se cuela quien ya no está en el viaje", () => {
    const suyos = participantesDeGasto(gasto("a", 30, ["a", "z"]), viajeros);
    expect(suyos.map((v) => v.nombre)).toEqual(["Ana"]);
  });
});

describe("calcularTotal", () => {
  it("suma los importes", () => {
    expect(calcularTotal([gasto("a", 30, ["a"]), gasto("b", 20, ["b"])])).toBe(50);
  });

  it("sin gastos, cero", () => {
    expect(calcularTotal([])).toBe(0);
  });
});

describe("calcularBalances", () => {
  it("reparte a partes iguales entre todos", () => {
    const bal = calcularBalances(viajeros, [gasto("a", 90, ["a", "b", "c"])]);

    expect(bal.find((v) => v.id === "a").balance).toBe(60); // puso 90, le tocaban 30
    expect(bal.find((v) => v.id === "b").balance).toBe(-30);
    expect(bal.find((v) => v.id === "c").balance).toBe(-30);
  });

  it("solo reparte entre los que van en el gasto", () => {
    const bal = calcularBalances(viajeros, [gasto("a", 60, ["a", "b"])]);

    expect(bal.find((v) => v.id === "a").balance).toBe(30);
    expect(bal.find((v) => v.id === "b").balance).toBe(-30);
    // Marta no cenó, así que ni debe ni le deben.
    expect(bal.find((v) => v.id === "c").balance).toBe(0);
  });

  it("los balances siempre suman cero", () => {
    const bal = calcularBalances(viajeros, [
      gasto("a", 90, ["a", "b", "c"]),
      gasto("b", 45, ["b", "c"]),
      gasto("c", 20, ["a", "c"]),
    ]);

    const suma = bal.reduce((t, v) => t + v.balance, 0);
    expect(suma).toBeCloseTo(0);
  });

  it("guarda lo que puso cada uno y lo que le tocaba", () => {
    const bal = calcularBalances(viajeros, [gasto("a", 60, ["a", "b"])]);
    const deAna = bal.find((v) => v.id === "a");

    expect(deAna.puesto).toBe(60);
    expect(deAna.tocaPagar).toBe(30);
  });

  it("un gasto de alguien que ya no está no descuadra", () => {
    // Si borras a un viajero, sus gastos se van con él, pero por si acaso.
    const bal = calcularBalances(viajeros, [gasto("z", 30, ["a", "b", "c"])]);
    expect(bal.every((v) => v.puesto === 0)).toBe(true);
  });

  it("sin gastos, todos a cero", () => {
    const bal = calcularBalances(viajeros, []);
    expect(bal.every((v) => v.balance === 0)).toBe(true);
  });
});

describe("calcularLeTocaPagar", () => {
  it("le toca al que menos ha puesto", () => {
    const bal = calcularBalances(viajeros, [gasto("a", 90, ["a", "b", "c"])]);
    // Luis y Marta están a -30; sale el primero que encuentre.
    expect(calcularLeTocaPagar(bal).nombre).toBe("Luis");
  });

  it("si está todo igualado, paga quien quiera", () => {
    const bal = calcularBalances(viajeros, []);
    expect(calcularLeTocaPagar(bal)).toEqual({ igualados: true });
  });

  it("sin viajeros no dice nada", () => {
    expect(calcularLeTocaPagar([])).toBe(null);
  });
});

describe("calcularPagos", () => {
  it("un deudor y un acreedor, un solo pago", () => {
    const bal = calcularBalances([ana, luis], [gasto("a", 50, ["a", "b"])]);
    expect(calcularPagos(bal)).toEqual([{ de: "Luis", a: "Ana", cantidad: 25 }]);
  });

  it("cuentas saldadas, ningún pago", () => {
    const bal = calcularBalances([ana, luis], [
      gasto("a", 50, ["a", "b"]),
      gasto("b", 50, ["a", "b"]),
    ]);
    expect(calcularPagos(bal)).toEqual([]);
  });

  it("lo que se paga cuadra con lo que se debe", () => {
    const bal = calcularBalances(viajeros, [
      gasto("a", 120, ["a", "b", "c"]),
      gasto("b", 30, ["b", "c"]),
    ]);

    const pagos = calcularPagos(bal);
    const total = pagos.reduce((t, p) => t + p.cantidad, 0);
    const deuda = bal.filter((v) => v.balance < 0).reduce((t, v) => t - v.balance, 0);

    expect(total).toBeCloseTo(deuda);
  });

  it("deja a todo el mundo a cero", () => {
    const bal = calcularBalances(viajeros, [
      gasto("a", 100, ["a", "b", "c"]),
      gasto("b", 50, ["a", "b"]),
      gasto("c", 25, ["c"]),
    ]);

    // Aplicamos los pagos y miramos que nadie quede debiendo.
    const restante = new Map(bal.map((v) => [v.nombre, v.balance]));
    for (const pago of calcularPagos(bal)) {
      restante.set(pago.de, restante.get(pago.de) + pago.cantidad);
      restante.set(pago.a, restante.get(pago.a) - pago.cantidad);
    }

    for (const saldo of restante.values()) expect(saldo).toBeCloseTo(0);
  });

  it("hace los menos pagos posibles", () => {
    // Aquí el orden importa: si juntas al que más debe con el que más se le
    // debe, cada uno se salda de un pago. Emparejando mal salen cinco.
    const bal = [
      { id: "1", nombre: "Ana", balance: 100 },
      { id: "2", nombre: "Luis", balance: 50 },
      { id: "3", nombre: "Marta", balance: -100 },
      { id: "4", nombre: "Pepe", balance: -50 },
    ];

    expect(calcularPagos(bal)).toEqual([
      { de: "Marta", a: "Ana", cantidad: 100 },
      { de: "Pepe", a: "Luis", cantidad: 50 },
    ]);
  });

  it("los céntimos sueltos no generan pagos de mentira", () => {
    // 10 entre 3 no da exacto; lo que sobra no debería salir como deuda.
    const bal = calcularBalances(viajeros, [gasto("a", 10, ["a", "b", "c"])]);
    const pagos = calcularPagos(bal);

    expect(pagos.every((p) => p.cantidad > 0.01)).toBe(true);
  });
});
