import { describe, it, expect } from "vitest";
import { BOTE, esDelBote, enElBote, hayBote, balancesConBote, sinBote } from "./bote";
import { calcularBalances, calcularPagos, calcularLeTocaPagar } from "./calculos";

const ana = { id: "a", nombre: "Ana" };
const luis = { id: "b", nombre: "Luis" };
const marta = { id: "c", nombre: "Marta" };
const viajeros = [ana, luis, marta];

function gasto(pagadorId, importe, participantes) {
  return { id: `g${pagadorId}${importe}`, pagadorId, importe, participantes };
}

function aporta(viajeroId, importe) {
  return { id: `ap${viajeroId}${importe}`, viajeroId, importe };
}

const deCada = (cuanto) => viajeros.map((v) => aporta(v.id, cuanto));
const balanceDe = (balances, id) => balances.find((v) => v.id === id).balance;

describe("enElBote", () => {
  it("lo puesto menos lo gastado desde el bote", () => {
    const gastos = [gasto(BOTE, 45, ["a", "b", "c"]), gasto("a", 100, ["a", "b", "c"])];
    expect(enElBote(deCada(20), gastos)).toBe(15);
  });

  it("con lo convertido a la moneda del viaje", () => {
    const gastos = [{ ...gasto(BOTE, 5000, ["a"]), importeConvertido: 40 }];
    expect(enElBote(deCada(20), gastos)).toBe(20);
  });

  it("si se ha pagado de más, sale negativo", () => {
    expect(enElBote([aporta("a", 10)], [gasto(BOTE, 25, ["a"])])).toBe(-15);
  });
});

describe("hayBote", () => {
  it("sin aportaciones ni gastos del bote, no hay", () => {
    expect(hayBote([], [gasto("a", 10, ["a"])])).toBe(false);
  });

  it("con una aportación, o con un gasto del bote, sí", () => {
    expect(hayBote([aporta("a", 10)], [])).toBe(true);
    expect(hayBote([], [gasto(BOTE, 10, ["a"])])).toBe(true);
  });

  it("esDelBote mira el pagador", () => {
    expect(esDelBote(gasto(BOTE, 10, []))).toBe(true);
    expect(esDelBote(gasto("a", 10, []))).toBe(false);
  });
});

describe("balancesConBote", () => {
  it("sin bote, los balances de siempre", () => {
    const gastos = [gasto("a", 90, ["a", "b", "c"])];
    expect(balancesConBote(viajeros, gastos, [], [])).toEqual(calcularBalances(viajeros, gastos));
  });

  it("si todo sale del bote y se gasta entero, todos a cero", () => {
    const balances = balancesConBote(viajeros, [gasto(BOTE, 60, ["a", "b", "c"])], [], deCada(20));

    for (const v of balances) expect(v.balance).toBeCloseTo(0);
    expect(calcularPagos(balances)).toEqual([]);
  });

  it("lo que sobra se devuelve a cada uno", () => {
    // 20 cada uno y se gastan 45: sobran 15, 5 para cada uno.
    const balances = balancesConBote(viajeros, [gasto(BOTE, 45, ["a", "b", "c"])], [], deCada(20));
    const pagos = calcularPagos(balances);

    expect(balanceDe(balances, BOTE)).toBeCloseTo(-15);
    expect(pagos).toHaveLength(3);
    for (const p of pagos) {
      expect(p.deId).toBe(BOTE);
      expect(p.cantidad).toBeCloseTo(5);
    }
  });

  it("quien no ha puesto en el bote le debe a quien sí", () => {
    // Ana y Luis ponen 30, Marta nada. Se gastan 60 entre los tres.
    const aportaciones = [aporta("a", 30), aporta("b", 30)];
    const balances = balancesConBote(viajeros, [gasto(BOTE, 60, ["a", "b", "c"])], [], aportaciones);

    expect(balanceDe(balances, "a")).toBeCloseTo(10);
    expect(balanceDe(balances, "b")).toBeCloseTo(10);
    expect(balanceDe(balances, "c")).toBeCloseTo(-20);
    expect(balanceDe(balances, BOTE)).toBeCloseTo(0);
  });

  it("se mezcla con los gastos que paga cada uno", () => {
    // Bote de 20 cada uno, se gastan 60 de ahí, y Ana paga aparte una cena de 30.
    const gastos = [gasto(BOTE, 60, ["a", "b", "c"]), gasto("a", 30, ["a", "b", "c"])];
    const balances = balancesConBote(viajeros, gastos, [], deCada(20));

    expect(balanceDe(balances, "a")).toBeCloseTo(20);
    expect(balanceDe(balances, "b")).toBeCloseTo(-10);
    expect(balanceDe(balances, "c")).toBeCloseTo(-10);
  });

  it("los balances siempre suman cero", () => {
    const gastos = [gasto(BOTE, 47.3, ["a", "b"]), gasto("c", 12, ["a", "c"])];
    const balances = balancesConBote(viajeros, gastos, [], [aporta("a", 50), aporta("c", 10)]);

    expect(balances.reduce((t, v) => t + v.balance, 0)).toBeCloseTo(0);
  });

  it("si se ha pagado de más desde el bote, alguien tiene que meter", () => {
    const balances = balancesConBote(viajeros, [gasto(BOTE, 90, ["a", "b", "c"])], [], deCada(20));
    const pagos = calcularPagos(balances);

    expect(balanceDe(balances, BOTE)).toBeCloseTo(30);
    expect(pagos.every((p) => p.aId === BOTE)).toBe(true);
    expect(pagos.reduce((t, p) => t + p.cantidad, 0)).toBeCloseTo(30);
  });

  it("apunta lo que ha puesto cada uno en el bote", () => {
    const balances = balancesConBote(viajeros, [], [], [aporta("a", 20), aporta("a", 5)]);
    expect(balances.find((v) => v.id === "a").alBote).toBe(25);
    expect(balances.find((v) => v.id === "b").alBote).toBe(0);
  });

  it("lo de alguien que ya no está no descuadra", () => {
    const balances = balancesConBote([ana, luis], [], [], [aporta("a", 20), aporta("z", 50)]);
    expect(balances.reduce((t, v) => t + v.balance, 0)).toBeCloseTo(0);
  });

  it("los pagos a cuenta siguen contando", () => {
    const parciales = [{ deId: "c", aId: "a", importe: 10 }];
    const balances = balancesConBote(viajeros, [gasto(BOTE, 60, ["a", "b", "c"])], parciales, [
      aporta("a", 30),
      aporta("b", 30),
    ]);

    expect(balanceDe(balances, "c")).toBeCloseTo(-10);
    expect(balanceDe(balances, "a")).toBeCloseTo(0);
  });
});

describe("sinBote", () => {
  it("deja solo a las personas", () => {
    const balances = balancesConBote(viajeros, [], [], [aporta("a", 10)]);
    expect(sinBote(balances).map((v) => v.id)).toEqual(["a", "b", "c"]);
  });

  it("al bote nunca le toca pagar la próxima", () => {
    // Ana pone 50 y se gastan 30: al bote le sobran 20 y es el de peor balance.
    const balances = balancesConBote(viajeros, [gasto(BOTE, 30, ["a", "b", "c"])], [], [aporta("a", 50)]);

    expect(calcularLeTocaPagar(balances).nombre).toBe("Bote");
    expect(calcularLeTocaPagar(sinBote(balances)).nombre).toBe("Luis");
  });
});
