import { describe, it, expect } from "vitest";
import { tituloDePestana, tituloDelViaje, cuentaEnTitulo, cuentaDeNeto, miNeto, TITULO_SIN_VIAJE } from "./titulo";

describe("tituloDePestana", () => {
  it("con viaje, su nombre delante", () => {
    expect(tituloDePestana("Lisboa")).toBe("Lisboa · SaldoCero");
  });

  it("sin viaje, el de siempre", () => {
    expect(tituloDePestana(null)).toBe(TITULO_SIN_VIAJE);
  });

  it("con el nombre vacío, también el de siempre", () => {
    expect(tituloDePestana("  ")).toBe(TITULO_SIN_VIAJE);
  });

  it("con lo tuyo, entre el nombre y la marca", () => {
    expect(tituloDePestana("Lisboa", "debes 20.00 €")).toBe("Lisboa · debes 20.00 € · SaldoCero");
  });
});

describe("cuentaEnTitulo", () => {
  it("lo que debes", () => {
    expect(cuentaEnTitulo({ debes: 20, teDeben: 0 })).toBe("debes 20.00 €");
  });

  it("lo que te deben, en la moneda del viaje", () => {
    expect(cuentaEnTitulo({ debes: 0, teDeben: 15 }, "USD")).toBe("te deben $15.00");
  });

  it("con las dos cosas, lo neto", () => {
    expect(cuentaEnTitulo({ debes: 30, teDeben: 10 })).toBe("debes 20.00 €");
  });

  it("en paz, nada", () => {
    expect(cuentaEnTitulo({ debes: 0, teDeben: 0 })).toBe(null);
    expect(cuentaEnTitulo(null)).toBe(null);
  });
});

describe("tituloDelViaje", () => {
  const viaje = {
    nombre: "Lisboa",
    moneda: "EUR",
    viajeros: [
      { id: "ana", nombre: "Ana" },
      { id: "luis", nombre: "Luis" },
    ],
    gastos: [{ id: "g1", pagadorId: "ana", importe: 90 }],
  };

  it("sin viaje, el de siempre", () => {
    expect(tituloDelViaje(null, "ana")).toBe(TITULO_SIN_VIAJE);
  });

  it("al que pagó le deben su parte", () => {
    expect(tituloDelViaje(viaje, "ana")).toBe("Lisboa · te deben 45.00 € · SaldoCero");
  });

  it("y el otro la debe", () => {
    expect(tituloDelViaje(viaje, "luis")).toBe("Lisboa · debes 45.00 € · SaldoCero");
  });

  it("sin saber quién eres, solo el nombre", () => {
    expect(tituloDelViaje(viaje, null)).toBe("Lisboa · SaldoCero");
  });

  it("si te han quitado del viaje, solo el nombre", () => {
    expect(tituloDelViaje(viaje, "pepe")).toBe("Lisboa · SaldoCero");
  });

  it("lo ya pagado no cuenta", () => {
    const pagado = { ...viaje, saldados: [{ deId: "luis", aId: "ana" }] };
    expect(tituloDelViaje(pagado, "luis")).toBe("Lisboa · SaldoCero");
  });
});

describe("miNeto", () => {
  const viaje = {
    viajeros: [{ id: "ana" }, { id: "luis" }, { id: "eva" }],
    gastos: [{ id: "g1", pagadorId: "ana", importe: 100 }],
  };

  it("en positivo si te deben, en negativo si debes, a céntimos", () => {
    expect(miNeto(viaje, "ana")).toBe(66.67);
    expect(miNeto(viaje, "luis")).toBe(-33.33);
  });

  it("sin saber quién eres, o si ya no estás, null", () => {
    expect(miNeto(viaje, null)).toBeNull();
    expect(miNeto(viaje, "pepe")).toBeNull();
    expect(miNeto(null, "ana")).toBeNull();
  });

  it("lo ya pagado no cuenta", () => {
    const pagado = { ...viaje, saldados: [{ deId: "luis", aId: "ana" }] };
    expect(miNeto(pagado, "luis")).toBe(0);
    expect(miNeto(pagado, "ana")).toBe(33.33);
  });
});

describe("cuentaDeNeto", () => {
  it("con su moneda", () => {
    expect(cuentaDeNeto(23, "EUR")).toBe("te deben 23.00 €");
    expect(cuentaDeNeto(-12.5, "USD")).toBe("debes $12.50");
  });

  it("a cero, o sin guardar todavía, nada", () => {
    expect(cuentaDeNeto(0)).toBeNull();
    expect(cuentaDeNeto(null)).toBeNull();
    expect(cuentaDeNeto(undefined)).toBeNull();
  });
});
