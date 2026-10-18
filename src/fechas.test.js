import { describe, it, expect, vi, afterEach } from "vitest";
import { hoy, ayer, anteayer, diasRapidos, enCorto, comoTitulo, porDias, cuantosGastos, haceCuanto, apuntadoHace, cuandoFue } from "./fechas";

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

  it("los de este año, sin el año", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T10:00:00"));

    expect(comoTitulo("2026-08-15")).toBe(enCorto("2026-08-15"));
    vi.useRealTimers();
  });

  it("los de otro año, con el año", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T10:00:00"));

    expect(comoTitulo("2025-10-11")).toBe(`${enCorto("2025-10-11")} 2025`);
    vi.useRealTimers();
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

describe("anteayer", () => {
  it("dos días antes, aunque cambie el mes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T10:00:00"));

    expect(anteayer()).toBe("2026-02-27");
    vi.useRealTimers();
  });
});

describe("diasRapidos", () => {
  it("hoy primero, luego ayer y anteayer", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T18:00:00"));

    expect(diasRapidos()).toEqual([
      { nombre: "Hoy", fecha: "2026-10-06" },
      { nombre: "Ayer", fecha: "2026-10-05" },
      { nombre: "Anteayer", fecha: "2026-10-04" },
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

describe("haceCuanto", () => {
  const ahora = new Date("2026-10-10T18:00:00");
  const el = (fecha) => new Date(fecha).getTime();

  it("hoy y ayer, por días del calendario", () => {
    expect(haceCuanto(el("2026-10-10T09:00:00"), ahora)).toBe("hoy");
    // Anoche fue hace menos de 24 horas, pero es ayer.
    expect(haceCuanto(el("2026-10-09T23:30:00"), ahora)).toBe("ayer");
  });

  it("días, semanas y meses", () => {
    expect(haceCuanto(el("2026-10-07T12:00:00"), ahora)).toBe("hace 3 días");
    expect(haceCuanto(el("2026-10-02T12:00:00"), ahora)).toBe("hace una semana");
    expect(haceCuanto(el("2026-09-20T12:00:00"), ahora)).toBe("hace 2 semanas");
    expect(haceCuanto(el("2026-09-05T12:00:00"), ahora)).toBe("hace un mes");
    expect(haceCuanto(el("2026-06-01T12:00:00"), ahora)).toBe("hace 4 meses");
    expect(haceCuanto(el("2025-01-01T12:00:00"), ahora)).toBe("hace más de un año");
  });

  it("del futuro, hoy", () => {
    expect(haceCuanto(el("2026-10-12T12:00:00"), ahora)).toBe("hoy");
  });

  it("los viajes guardados antes de esto no traen la fecha", () => {
    expect(haceCuanto(undefined, ahora)).toBe("");
    expect(haceCuanto(null, ahora)).toBe("");
  });
});

describe("apuntadoHace", () => {
  const ahora = Date.parse("2026-10-11T18:00:00Z");
  const antes = (minutos) => new Date(ahora - minutos * 60000).toISOString();

  it("recién apuntado", () => {
    expect(apuntadoHace(antes(0), ahora)).toBe("ahora mismo");
  });

  it("en minutos", () => {
    expect(apuntadoHace(antes(5), ahora)).toBe("hace 5 min");
    expect(apuntadoHace(antes(59), ahora)).toBe("hace 59 min");
  });

  it("en horas, sin redondear hacia arriba", () => {
    expect(apuntadoHace(antes(60), ahora)).toBe("hace 1 h");
    expect(apuntadoHace(antes(179), ahora)).toBe("hace 2 h");
  });

  it("pasado un día, nada", () => {
    expect(apuntadoHace(antes(24 * 60), ahora)).toBeNull();
  });

  it("del futuro, ahora mismo", () => {
    expect(apuntadoHace(antes(-10), ahora)).toBe("ahora mismo");
  });

  it("sin fecha, nada", () => {
    expect(apuntadoHace(undefined, ahora)).toBeNull();
  });

  it("con la fecha como la manda Supabase", () => {
    const deSupabase = "2026-10-11T17:29:59.900000+00:00";
    expect(apuntadoHace(deSupabase, ahora)).toBe("hace 30 min");
  });
});

describe("cuandoFue", () => {
  it("dentro del mismo mes, el mes una vez", () => {
    expect(cuandoFue(["2026-09-14", "2026-09-11", "2026-09-12"])).toBe("Del 11 al 14 de septiembre de 2026");
  });

  it("entre dos meses, los dos", () => {
    expect(cuandoFue(["2026-08-28", "2026-09-02"])).toBe("Del 28 de agosto al 2 de septiembre de 2026");
  });

  it("entre dos años, los dos años", () => {
    expect(cuandoFue(["2025-12-30", "2026-01-02"])).toBe("Del 30 de diciembre de 2025 al 2 de enero de 2026");
  });

  it("un solo día", () => {
    expect(cuandoFue(["2026-09-11", "2026-09-11"])).toBe("El 11 de septiembre de 2026");
  });

  it("los gastos de antes de las fechas no cuentan, y sin ninguna no hay nada que decir", () => {
    expect(cuandoFue([undefined, "2026-09-11", null])).toBe("El 11 de septiembre de 2026");
    expect(cuandoFue([undefined])).toBeNull();
    expect(cuandoFue([])).toBeNull();
  });
});
