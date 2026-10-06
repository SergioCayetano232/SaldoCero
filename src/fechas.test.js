import { describe, it, expect, vi, afterEach } from "vitest";
import { hoy, ayer, diasRapidos, enCorto, comoTitulo, porDias, cuantosGastos } from "./fechas";

describe("hoy", () => {
  it("da la fecha en el formato de la base de datos", () => {
    expect(hoy()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("enCorto", () => {
  it("escribe el día en corto y en español", () => {
    // Un día fijo, para que no dependa de cuándo se corra la prueba.
    const texto = enCorto("2026-03-15");

    expect(texto).toContain("15");
    expect(texto.toLowerCase()).toContain("mar");
  });

  it("no se va de día por la zona horaria", () => {
    // Poniendo la hora a mediodía, el día no se corre ni yendo ni viniendo.
    expect(enCorto("2026-01-01")).toContain("1");
  });
});

describe("comoTitulo", () => {
  it("el día de hoy se llama Hoy", () => {
    expect(comoTitulo(hoy())).toBe("Hoy");
  });

  it("el de ayer, Ayer", () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);

    expect(comoTitulo(ayer.toLocaleDateString("sv-SE"))).toBe("Ayer");
  });

  it("los demás llevan su fecha", () => {
    const titulo = comoTitulo("2020-06-10");

    expect(titulo).not.toBe("Hoy");
    expect(titulo).toContain("10");
  });
});

describe("porDias", () => {
  const gastos = [
    { id: "1", fecha: "2026-03-14", concepto: "Cena" },
    { id: "2", fecha: "2026-03-15", concepto: "Hotel" },
    { id: "3", fecha: "2026-03-14", concepto: "Taxi" },
  ];

  it("junta los del mismo día", () => {
    const dias = porDias(gastos);
    const catorce = dias.find((d) => d.fecha === "2026-03-14");

    expect(catorce.gastos).toHaveLength(2);
  });

  it("pone primero el día más reciente", () => {
    expect(porDias(gastos).map((d) => d.fecha)).toEqual(["2026-03-15", "2026-03-14"]);
  });

  it("respeta el orden dentro de cada día", () => {
    const catorce = porDias(gastos).find((d) => d.fecha === "2026-03-14");
    expect(catorce.gastos.map((g) => g.concepto)).toEqual(["Cena", "Taxi"]);
  });

  it("los gastos sin fecha van juntos al final", () => {
    const dias = porDias([...gastos, { id: "4", concepto: "Viejo" }]);

    expect(dias.at(-1).fecha).toBe("");
    expect(dias.at(-1).gastos[0].concepto).toBe("Viejo");
  });

  it("sin gastos, ningún día", () => {
    expect(porDias([])).toEqual([]);
  });

  it("no se pierde ni se duplica ningún gasto", () => {
    const total = porDias(gastos).reduce((t, d) => t + d.gastos.length, 0);
    expect(total).toBe(gastos.length);
  });
});

describe("ayer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("es el día de antes, aunque cambie el mes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T10:00:00"));

    expect(ayer()).toBe("2026-02-28");
  });

  it("y el año", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:30:00"));

    expect(ayer()).toBe("2025-12-31");
  });
});

describe("diasRapidos", () => {
  it("hoy primero y luego ayer", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T18:00:00"));

    expect(diasRapidos()).toEqual([
      { nombre: "Hoy", fecha: "2026-10-06" },
      { nombre: "Ayer", fecha: "2026-10-05" },
    ]);
    vi.useRealTimers();
  });
});

describe("cuantosGastos", () => {
  it("uno en singular", () => {
    expect(cuantosGastos(1)).toBe("1 gasto");
  });

  it("varios en plural", () => {
    expect(cuantosGastos(4)).toBe("4 gastos");
  });
});
