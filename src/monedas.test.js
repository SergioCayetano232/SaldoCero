import { describe, it, expect, vi, afterEach } from "vitest";
import { cambio, esAMano, leerTasa, leerImporte, tasaDeGasto, tasaComoTexto, conMoneda, monedaDelSiguiente } from "./monedas";

describe("leerTasa", () => {
  it("vale con coma o con punto", () => {
    expect(leerTasa("10,85")).toBe(10.85);
    expect(leerTasa("10.85")).toBe(10.85);
    expect(leerTasa(" 0,092 ")).toBe(0.092);
    expect(leerTasa(",5")).toBe(0.5);
  });

  it("lo que no es un cambio da null", () => {
    expect(leerTasa("")).toBeNull();
    expect(leerTasa("abc")).toBeNull();
    expect(leerTasa("1,2,3")).toBeNull();
    expect(leerTasa("-3")).toBeNull();
    expect(leerTasa(null)).toBeNull();
  });

  it("un cambio de cero no sirve", () => {
    expect(leerTasa("0")).toBeNull();
    expect(leerTasa("0,00")).toBeNull();
  });
});

describe("tasaDeGasto", () => {
  it("sale de lo pagado y lo convertido", () => {
    expect(tasaDeGasto({ importe: 100, importeConvertido: 9.2 })).toBeCloseTo(0.092);
  });

  it("los gastos de antes de las monedas van uno por uno", () => {
    expect(tasaDeGasto({ importe: 30 })).toBe(1);
  });

  it("volver a convertir con ella da lo mismo que había", () => {
    const gasto = { importe: 33.33, importeConvertido: 30.77 };
    const tasa = Number(tasaComoTexto(tasaDeGasto(gasto)).replace(",", "."));
    expect(Number((gasto.importe * tasa).toFixed(2))).toBe(30.77);
  });
});

describe("tasaComoTexto", () => {
  it("con coma y sin colas de decimales", () => {
    expect(tasaComoTexto(0.5)).toBe("0,5");
    expect(tasaComoTexto(1 / 3)).toBe("0,333333");
    expect(tasaComoTexto(10)).toBe("10");
  });
});

describe("monedas a mano", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("el dírham va a mano y el dólar no", () => {
    expect(esAMano("MAD")).toBe(true);
    expect(esAMano("USD")).toBe(false);
    expect(esAMano("XXX")).toBe(false);
  });

  it("para esas no se pregunta a la API", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    expect(await cambio("MAD", "EUR")).toBeNull();
    expect(await cambio("EUR", "COP")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("se escriben con su símbolo", () => {
    expect(conMoneda(150, "MAD")).toBe("150.00 DH");
  });
});

describe("leerImporte", () => {
  it("con coma o punto, redondeado al céntimo", () => {
    expect(leerImporte("20")).toBe(20);
    expect(leerImporte("12,5")).toBe(12.5);
    expect(leerImporte("10.456")).toBe(10.46);
  });

  it("menos de medio céntimo no es un pago", () => {
    expect(leerImporte("0,004")).toBeNull();
    expect(leerImporte("")).toBeNull();
    expect(leerImporte("-5")).toBeNull();
  });
});

describe("monedaDelSiguiente", () => {
  const antes = { moneda: "EUR", tasaAMano: null };

  it("tras apuntar uno, se queda la moneda que usaste", () => {
    expect(monedaDelSiguiente(antes, { moneda: "USD", tasaAMano: null }, false)).toEqual({
      moneda: "USD",
      tasaAMano: null,
    });
  });

  it("y el cambio escrito a mano, que sigue valiendo", () => {
    expect(monedaDelSiguiente(antes, { moneda: "MAD", tasaAMano: "0,092" }, false)).toEqual({
      moneda: "MAD",
      tasaAMano: "0,092",
    });
  });

  it("al editar uno, vuelve a la de antes", () => {
    expect(monedaDelSiguiente({ moneda: "MAD", tasaAMano: "0,092" }, { moneda: "EUR", tasaAMano: null }, true)).toEqual({
      moneda: "MAD",
      tasaAMano: "0,092",
    });
  });
});
