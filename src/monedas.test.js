import { describe, it, expect, vi, afterEach } from "vitest";
import { MONEDAS, cambio, esAMano, leerTasa, leerImporte, tasaDeGasto, tasaComoTexto, conMoneda, monedaDelSiguiente, monedasEnOrden, monedaDeCasa, banderaDe, monedaConBandera, cambioDelGasto } from "./monedas";

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

describe("monedasEnOrden", () => {
  const codigos = (lista) => lista.map((m) => m.codigo);
  const pagado = (moneda) => ({ moneda });

  it("sin gastos, la del viaje primero y luego como siempre", () => {
    const orden = codigos(monedasEnOrden([], "GBP"));
    expect(orden.slice(0, 3)).toEqual(["GBP", "EUR", "USD"]);
    expect(orden).toHaveLength(MONEDAS.length);
  });

  it("las usadas suben, la más usada antes", () => {
    const gastos = [pagado("EUR"), pagado("MAD"), pagado("USD"), pagado("MAD")];
    expect(codigos(monedasEnOrden(gastos, "EUR")).slice(0, 4)).toEqual(["EUR", "MAD", "USD", "GBP"]);
  });

  it("la del viaje va primera aunque se haya usado menos", () => {
    const gastos = [pagado("MAD"), pagado("MAD"), pagado("EUR")];
    expect(codigos(monedasEnOrden(gastos, "EUR"))[0]).toBe("EUR");
  });

  it("los gastos de antes sin moneda cuentan como de la del viaje", () => {
    expect(codigos(monedasEnOrden([{}, pagado("USD")], "EUR")).slice(0, 2)).toEqual(["EUR", "USD"]);
  });

  it("no pierde ni repite ninguna", () => {
    const orden = codigos(monedasEnOrden([pagado("VND"), pagado("JPY")], "EUR"));
    expect(new Set(orden).size).toBe(MONEDAS.length);
  });
});

describe("monedaDeCasa", () => {
  it("la del país del navegador", () => {
    expect(monedaDeCasa(["es-MX"])).toBe("MXN");
    expect(monedaDeCasa(["es-AR", "es"])).toBe("ARS");
    expect(monedaDeCasa(["en-GB"])).toBe("GBP");
  });

  it("en España y el resto del euro, euros", () => {
    expect(monedaDeCasa(["es-ES"])).toBe("EUR");
    expect(monedaDeCasa(["fr-FR", "en-US"])).toBe("EUR");
  });

  it("sin país, mira el siguiente idioma", () => {
    expect(monedaDeCasa(["es", "es-CO"])).toBe("COP");
  });

  it("sin nada que valga, euros", () => {
    expect(monedaDeCasa([])).toBe("EUR");
    expect(monedaDeCasa(["es"])).toBe("EUR");
    expect(monedaDeCasa(["es-419"])).toBe("EUR");
    expect(monedaDeCasa(["no es un idioma"])).toBe("EUR");
  });

  it("todas las que da están en la lista", () => {
    for (const pais of ["US", "MX", "VN", "MA", "PE"]) {
      expect(MONEDAS.some((m) => m.codigo === monedaDeCasa([`es-${pais}`]))).toBe(true);
    }
  });
});

describe("banderaDe", () => {
  it("la del país del código", () => {
    expect(banderaDe("USD")).toBe("🇺🇸");
    expect(banderaDe("GBP")).toBe("🇬🇧");
    expect(banderaDe("MAD")).toBe("🇲🇦");
  });

  it("el euro, la de Europa", () => {
    expect(banderaDe("EUR")).toBe("🇪🇺");
  });

  it("todas las de la lista tienen una", () => {
    for (const m of MONEDAS) expect(banderaDe(m.codigo)).toHaveLength(4);
  });

  it("algo raro, sin bandera", () => {
    expect(banderaDe("")).toBe("");
    expect(banderaDe(undefined)).toBe("");
    expect(banderaDe("usd")).toBe("");
  });
});

describe("monedaConBandera", () => {
  it("bandera y código", () => {
    expect(monedaConBandera("JPY")).toBe("🇯🇵 JPY");
  });

  it("sin bandera, solo el código", () => {
    expect(monedaConBandera("xx")).toBe("xx");
  });
});

describe("cambioDelGasto", () => {
  it("el que se le aplicó, con la moneda del viaje", () => {
    expect(cambioDelGasto({ moneda: "USD", importe: 50, importeConvertido: 46 }, "EUR")).toBe("1 USD = 0.92 EUR");
    expect(cambioDelGasto({ moneda: "GBP", importe: 100, importeConvertido: 117 }, "EUR")).toBe("1 GBP = 1.17 EUR");
  });

  it("con las monedas flojas, al revés", () => {
    expect(cambioDelGasto({ moneda: "JPY", importe: 5000, importeConvertido: 31.25 }, "EUR")).toBe("1 EUR = 160 JPY");
    expect(cambioDelGasto({ moneda: "MAD", importe: 300, importeConvertido: 27.75 }, "EUR")).toBe("1 EUR = 10.8 MAD");
  });

  it("en un viaje en yenes, el euro va derecho", () => {
    expect(cambioDelGasto({ moneda: "EUR", importe: 20, importeConvertido: 3240 }, "JPY")).toBe("1 EUR = 162 JPY");
  });

  it("en la moneda del viaje, o de los de antes sin moneda, nada", () => {
    expect(cambioDelGasto({ moneda: "EUR", importe: 20, importeConvertido: 20 }, "EUR")).toBeNull();
    expect(cambioDelGasto({ importe: 20 }, "EUR")).toBeNull();
  });
});
