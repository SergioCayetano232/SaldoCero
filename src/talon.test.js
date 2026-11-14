import { describe, it, expect } from "vitest";
import { datosDelTalon } from "./talon";
import { balancesConBote } from "./bote";

const viajeros = [
  { id: "ana", nombre: "Ana" },
  { id: "luis", nombre: "Luis" },
  { id: "marta", nombre: "Marta" },
];

function gasto(pagadorId, importe) {
  return { id: `g-${pagadorId}-${importe}`, pagadorId, importe, concepto: "X" };
}

function viajeCon(gastos, extra = {}) {
  return { viajeros, gastos, parciales: [], aportaciones: [], saldados: [], ...extra };
}

function talon(viaje, soy, opciones) {
  const balances = balancesConBote(viaje.viajeros, viaje.gastos, viaje.parciales, viaje.aportaciones);
  return datosDelTalon(balances, viaje, soy, opciones);
}

describe("datosDelTalon", () => {
  it("si no has dicho quién eres, no hay saldo tuyo", () => {
    expect(talon(viajeCon([gasto("ana", 30)]), null).saldo).toEqual({ tipo: "sin-ti" });
  });

  it("lo que debes, con a quién le toca la próxima", () => {
    const datos = talon(viajeCon([gasto("ana", 30)]), "marta");
    expect(datos.saldo.tipo).toBe("debes");
    expect(datos.saldo.cifra).toBeCloseTo(10);
    expect(datos.toca).toEqual({ tipo: "otro", nombre: "Luis" });
  });

  it("si te deben, lo dice así", () => {
    const datos = talon(viajeCon([gasto("ana", 30)]), "ana");
    expect(datos.saldo.tipo).toBe("te-deben");
    expect(datos.saldo.cifra).toBeCloseTo(20);
  });

  it("si te toca a ti, lo dice", () => {
    const datos = talon(viajeCon([gasto("ana", 30), gasto("marta", 30)]), "luis");
    expect(datos.toca).toEqual({ tipo: "tu" });
  });

  it("igualados, puede pagar cualquiera", () => {
    const datos = talon(viajeCon([gasto("ana", 10), gasto("luis", 10), gasto("marta", 10)]), "ana");
    expect(datos.saldo).toEqual({ tipo: "a-cero" });
    expect(datos.toca).toEqual({ tipo: "cualquiera" });
  });

  it("con lo tuyo ya pagado, está pagado", () => {
    const viaje = viajeCon([gasto("ana", 30)], { saldados: [{ de: "Luis", a: "Ana", deId: "luis", aId: "ana" }] });
    const datos = talon(viaje, "luis");
    expect(datos.saldo).toEqual({ tipo: "pagado" });
  });

  it("cerrado o sin gastos, no le toca a nadie", () => {
    expect(talon(viajeCon([gasto("ana", 30)]), "ana", { cerrado: true }).toca).toBeNull();
    expect(talon(viajeCon([]), "ana").toca).toBeNull();
  });

  it("cuenta los pagos que quedan", () => {
    expect(talon(viajeCon([gasto("ana", 30)]), "ana").pendientes).toBe(2);
  });
});
