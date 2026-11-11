import { describe, it, expect } from "vitest";
import { quienLlevaLaCuenta, vaConAlguien, juntarBalances, pagaYo, cobroYo, conQuienVa, losQueVanCon, conQuienPuedeIr, conColoresDeGrupos } from "./juntos";
import { calcularBalances, pagosDelViaje } from "./calculos";
import { miSaldo } from "./miSaldo";
import { cuantosMios } from "./globito";
import { mensajeDeCobro } from "./cobrar";

const ana = { id: "a", nombre: "Ana" };
const luis = { id: "l", nombre: "Luis", conId: "a" };
const eva = { id: "e", nombre: "Eva" };
const pepe = { id: "p", nombre: "Pepe" };

describe("quienLlevaLaCuenta", () => {
  it("cada uno la suya, salvo el que va con otro", () => {
    expect(quienLlevaLaCuenta([ana, luis, eva])).toEqual(new Map([["a", "a"], ["l", "a"], ["e", "e"]]));
  });

  it("si va con uno que ya va con otro, por libre", () => {
    const marta = { id: "m", nombre: "Marta", conId: "l" };
    expect(quienLlevaLaCuenta([ana, luis, marta]).get("m")).toBe("m");
  });

  it("si va con alguien que ya no está, o consigo mismo, por libre", () => {
    expect(quienLlevaLaCuenta([{ ...luis, conId: "x" }]).get("l")).toBe("l");
    expect(quienLlevaLaCuenta([{ ...ana, conId: "a" }]).get("a")).toBe("a");
  });

  it("vaConAlguien", () => {
    expect(vaConAlguien([ana, luis])).toBe(true);
    expect(vaConAlguien([ana, eva])).toBe(false);
  });
});

describe("juntarBalances", () => {
  it("sin grupos, los mismos", () => {
    const balances = [{ ...ana, balance: 10 }, { ...eva, balance: -10 }];
    expect(juntarBalances(balances)).toBe(balances);
  });

  it("los del grupo, sumados y con los dos nombres", () => {
    const juntos = juntarBalances([{ ...luis, balance: -20 }, { ...ana, balance: 50 }, { ...eva, balance: -30 }]);
    expect(juntos).toEqual([
      { ...ana, balance: 30, nombre: "Ana y Luis", ids: ["a", "l"] },
      { ...eva, balance: -30 },
    ]);
  });

  it("una familia de tres", () => {
    const hijo = { id: "h", nombre: "Hugo", conId: "a" };
    const [familia] = juntarBalances([{ ...ana, balance: 10 }, { ...luis, balance: 5 }, { ...hijo, balance: -40 }]);
    expect(familia).toMatchObject({ nombre: "Ana, Luis y Hugo", balance: -25, ids: ["a", "l", "h"] });
  });
});

describe("los pagos con grupos", () => {
  // Cena de 120 entre los cuatro, la paga Eva: cada uno 30.
  const viajeros = [ana, luis, eva, pepe];
  const cena = { id: "g", pagadorId: "e", importe: 120, importeConvertido: 120, moneda: "EUR" };
  const balances = calcularBalances(viajeros, [cena]);

  it("Ana y Luis hacen un solo pago por los dos", () => {
    const pagos = pagosDelViaje(balances, {});
    expect(pagos).toEqual([
      { de: "Ana y Luis", a: "Eva", deId: "a", aId: "e", deIds: ["a", "l"], cantidad: 60, saldado: false, porConfirmar: false },
      { de: "Pepe", a: "Eva", deId: "p", aId: "e", cantidad: 30, saldado: false, porConfirmar: false },
    ]);
  });

  it("sin grupos salen tres pagos, como siempre", () => {
    const sueltos = calcularBalances(viajeros.map((v) => ({ ...v, conId: null })), [cena]);
    expect(pagosDelViaje(sueltos, {})).toHaveLength(3);
  });

  it("el pago es de los dos: de tu saldo, del globito y del mensaje", () => {
    const pagos = pagosDelViaje(balances, {});
    expect(pagaYo(pagos[0], "l")).toBe(true);
    expect(pagaYo(pagos[0], "e")).toBe(false);
    expect(cobroYo(pagos[0], "e")).toBe(true);
    expect(miSaldo(pagos, "l")).toEqual({ debes: 60, teDeben: 0, tenias: true });
    expect(cuantosMios(pagos, "l")).toBe(1);
  });

  it("si cobra el grupo, el mensaje va en primera persona para cualquiera de los dos", () => {
    const pago = { de: "Eva", a: "Ana y Luis", deId: "e", aId: "a", aIds: ["a", "l"], cantidad: 20 };
    expect(mensajeDeCobro({ pago, soy: "l", nombreViaje: "Lisboa", moneda: "EUR" })).toMatch(/me debes/);
  });

  it("marcado como pagado, queda saldado para los dos", () => {
    const viaje = { saldados: [{ deId: "a", aId: "e", de: "Ana y Luis", a: "Eva" }] };
    const pagos = pagosDelViaje(balances, viaje);
    expect(pagos[0].saldado).toBe(true);
    expect(miSaldo(pagos, "l")).toEqual({ debes: 0, teDeben: 0, tenias: true });
  });

  it("sin saber quién eres, nada es tuyo", () => {
    expect(pagaYo({ deId: "a", deIds: ["a", "l"] }, null)).toBe(false);
    expect(cobroYo({ aId: "a" }, "")).toBe(false);
  });
});

describe("para elegir con quién va cada uno", () => {
  const viajeros = [ana, luis, eva, pepe];

  it("con quién va y quiénes van con él", () => {
    expect(conQuienVa(luis, viajeros)).toBe(ana);
    expect(conQuienVa(ana, viajeros)).toBeNull();
    expect(losQueVanCon(ana, viajeros)).toEqual([luis]);
    expect(losQueVanCon(eva, viajeros)).toEqual([]);
  });

  it("se puede ir con los que no van ya con otro", () => {
    expect(conQuienPuedeIr(eva, viajeros)).toEqual([ana, pepe]);
    expect(conQuienPuedeIr(luis, viajeros)).toEqual([ana, eva, pepe]);
  });

  it("el que lleva la cuenta de alguien no se puede ir con otro", () => {
    expect(conQuienPuedeIr(ana, viajeros)).toEqual([]);
  });
});

describe("conColoresDeGrupos", () => {
  it("el grupo, con el color del que lleva la cuenta", () => {
    const colores = new Map([["Ana", "#1"], ["Luis", "#2"], ["Eva", "#3"]]);
    const todos = conColoresDeGrupos(colores, [ana, luis, eva]);
    expect(todos.get("Ana y Luis")).toBe("#1");
    expect(todos.get("Luis")).toBe("#2");
    expect(colores.has("Ana y Luis")).toBe(false);
  });
});
