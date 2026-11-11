import { describe, it, expect } from "vitest";
import { confirmadoAlMarcar, puedeConfirmar, textoPorConfirmar, cuantosPorConfirmar } from "./confirmar";
import { marcarSaldados } from "./calculos";
import { BOTE } from "./bote";

const pago = { de: "Luis", a: "Ana", deId: "l", aId: "a", cantidad: 30 };

describe("confirmadoAlMarcar", () => {
  it("si lo marca el que cobra, ya está", () => {
    expect(confirmadoAlMarcar(pago, "a")).toBe(true);
  });

  it("si lo marca el que paga, u otro, o nadie dice quién es, queda por confirmar", () => {
    expect(confirmadoAlMarcar(pago, "l")).toBe(false);
    expect(confirmadoAlMarcar(pago, "m")).toBe(false);
    expect(confirmadoAlMarcar(pago, null)).toBe(false);
  });

  it("con el bote no hay a quién preguntar", () => {
    expect(confirmadoAlMarcar({ ...pago, aId: BOTE }, "l")).toBe(true);
    expect(confirmadoAlMarcar({ ...pago, deId: BOTE }, null)).toBe(true);
  });

  it("si cobra una pareja, vale cualquiera de los dos", () => {
    expect(confirmadoAlMarcar({ ...pago, aIds: ["a", "e"] }, "e")).toBe(true);
  });
});

describe("marcarSaldados con confirmación", () => {
  it("lo marcado sin confirmar sale pagado y por confirmar", () => {
    const [p] = marcarSaldados([pago], [{ deId: "l", aId: "a", confirmado: false }]);
    expect(p).toMatchObject({ saldado: true, porConfirmar: true });
  });

  it("los marcados de antes no traen el campo: confirmados", () => {
    const [p] = marcarSaldados([pago], [{ deId: "l", aId: "a" }]);
    expect(p).toMatchObject({ saldado: true, porConfirmar: false });
  });

  it("sin marcar, nada que confirmar", () => {
    expect(marcarSaldados([pago], [])[0].porConfirmar).toBe(false);
  });
});

describe("puedeConfirmar", () => {
  const porConfirmar = { ...pago, saldado: true, porConfirmar: true };

  it("solo el que cobra", () => {
    expect(puedeConfirmar(porConfirmar, "a")).toBe(true);
    expect(puedeConfirmar(porConfirmar, "l")).toBe(false);
    expect(puedeConfirmar(porConfirmar, null)).toBe(false);
  });

  it("si ya está confirmado, no", () => {
    expect(puedeConfirmar({ ...porConfirmar, porConfirmar: false }, "a")).toBe(false);
  });
});

describe("textoPorConfirmar", () => {
  it("al que cobra se le pregunta; a los demás se les dice qué falta", () => {
    expect(textoPorConfirmar(pago, "a")).toBe("¿Te ha llegado?");
    expect(textoPorConfirmar(pago, "l")).toBe("Falta que Ana confirme que le ha llegado");
  });
});

describe("cuantosPorConfirmar", () => {
  it("cuenta los que faltan", () => {
    expect(cuantosPorConfirmar([{ porConfirmar: true }, { porConfirmar: false }, {}])).toBe(1);
  });
});
