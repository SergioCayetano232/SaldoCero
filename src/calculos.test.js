import { describe, it, expect } from "vitest";
import {
  participantesDeGasto,
  importeDeGasto,
  calcularTotal,
  calcularBalances,
  calcularLeTocaPagar,
  calcularPagos,
  marcarSaldados,
  quedaPorPagar,
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

describe("gastos que se quedan sin gente", () => {
  it("un gasto sin participantes válidos no rompe las cuentas", () => {
    // Pasa si borras a los viajeros que iban en un gasto.
    const bal = calcularBalances(viajeros, [gasto("a", 50, ["z"])]);

    // Ana lo pagó, pero no hay entre quién repartirlo.
    expect(bal.find((v) => v.id === "a").puesto).toBe(50);
    expect(bal.every((v) => v.tocaPagar === 0)).toBe(true);
  });
});

describe("gastos en otra moneda", () => {
  // 60 libras que son 70 euros: las cuentas van con los 70.
  const enLibras = {
    id: "g1",
    pagadorId: "a",
    importe: 60,
    moneda: "GBP",
    importeConvertido: 70,
    concepto: "Cena",
    participantes: ["a", "b"],
  };

  it("cuenta el importe convertido, no el original", () => {
    expect(importeDeGasto(enLibras)).toBe(70);
  });

  it("un gasto viejo sin convertir usa su importe tal cual", () => {
    expect(importeDeGasto({ importe: 40 })).toBe(40);
  });

  it("el total va en la moneda del viaje", () => {
    expect(calcularTotal([enLibras])).toBe(70);
  });

  it("los balances se reparten sobre lo convertido", () => {
    const bal = calcularBalances(viajeros, [enLibras]);

    expect(bal.find((v) => v.id === "a").puesto).toBe(70);
    expect(bal.find((v) => v.id === "b").balance).toBe(-35);
  });

  it("se pueden mezclar monedas en un mismo viaje", () => {
    const bal = calcularBalances(viajeros, [
      enLibras,
      gasto("b", 30, ["a", "b"]), // este en euros
    ]);

    // 70 + 30 = 100 en total, 50 a cada uno de los dos.
    expect(calcularTotal([enLibras, gasto("b", 30, ["a", "b"])])).toBe(100);
    expect(bal.find((v) => v.id === "a").balance).toBe(20);
    expect(bal.find((v) => v.id === "b").balance).toBe(-20);
  });
});

describe("deudas ya pagadas", () => {
  const pagos = [
    { de: "Luis", a: "Ana", cantidad: 37.33 },
    { de: "Marta", a: "Ana", cantidad: 78.83 },
  ];

  it("marca el que está saldado y deja el otro", () => {
    const marcados = marcarSaldados(pagos, [{ de: "Luis", a: "Ana" }]);

    expect(marcados[0].saldado).toBe(true);
    expect(marcados[1].saldado).toBe(false);
  });

  it("sin nada saldado, ninguno lo está", () => {
    expect(marcarSaldados(pagos).every((p) => !p.saldado)).toBe(true);
  });

  it("no confunde la ida con la vuelta", () => {
    // Que Luis le pagara a Ana no significa que Ana le haya pagado a Luis.
    const marcados = marcarSaldados([{ de: "Ana", a: "Luis", cantidad: 10 }], [
      { de: "Luis", a: "Ana" },
    ]);

    expect(marcados[0].saldado).toBe(false);
  });

  it("no toca las cantidades", () => {
    const marcados = marcarSaldados(pagos, [{ de: "Luis", a: "Ana" }]);
    expect(marcados[0].cantidad).toBe(37.33);
  });

  it("suma solo lo que queda por pagar", () => {
    const marcados = marcarSaldados(pagos, [{ de: "Luis", a: "Ana" }]);
    expect(quedaPorPagar(marcados)).toBeCloseTo(78.83);
  });

  it("si está todo pagado, no queda nada", () => {
    const marcados = marcarSaldados(pagos, [
      { de: "Luis", a: "Ana" },
      { de: "Marta", a: "Ana" },
    ]);

    expect(quedaPorPagar(marcados)).toBe(0);
  });
});
