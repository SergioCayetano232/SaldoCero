import { describe, it, expect, vi } from "vitest";
import { resumenEnTexto, enQueSeFue, enlaceDelViaje, invitacion, invitar, nombreDeArchivo, compartirImagen, copiarAlPortapapeles } from "./compartir";
import { PATRONES } from "./vibrar";

// Un viaje de ejemplo, para no repetirlo en cada prueba.
const viaje = {
  nombre: "Lisboa",
  codigo: "ABC12345",
  total: 326.5,
  moneda: "EUR",
  balances: [
    { id: "a", nombre: "Ana", puesto: 240, tocaPagar: 108.83, balance: 131.17 },
    { id: "b", nombre: "Luis", puesto: 86.5, tocaPagar: 108.83, balance: -22.33 },
    { id: "c", nombre: "Marta", puesto: 0, tocaPagar: 108.83, balance: -108.83 },
  ],
  pagos: [
    { de: "Marta", a: "Ana", cantidad: 108.83, saldado: false },
    { de: "Luis", a: "Ana", cantidad: 22.33, saldado: false },
  ],
};

describe("enQueSeFue", () => {
  const gastos = [
    { importe: 60, categoria: "comida" },
    { importe: 30, categoria: "comida" },
    { importe: 150, categoria: "alojamiento" },
    // Pagado en dólares: cuenta lo que fue en euros.
    { importe: 66, importeConvertido: 60, categoria: "transporte" },
  ];

  it("de más a menos, con lo que es del total", () => {
    expect(enQueSeFue(gastos, "EUR")).toEqual([
      "· 🛏️ Alojamiento: 150.00 € (50 %)",
      "· 🍽️ Comida: 90.00 € (30 %)",
      "· 🚌 Transporte: 60.00 € (20 %)",
    ]);
  });

  it("los de antes sin categoría van a otros", () => {
    expect(enQueSeFue([{ importe: 10, categoria: "ocio" }, { importe: 30 }], "EUR")).toEqual([
      "· 📦 Otros: 30.00 € (75 %)",
      "· 🎟️ Ocio: 10.00 € (25 %)",
    ]);
  });

  it("con una sola categoría, o sin gastos, nada", () => {
    expect(enQueSeFue([{ importe: 10, categoria: "comida" }, { importe: 5, categoria: "comida" }], "EUR")).toEqual([]);
    expect(enQueSeFue([], "EUR")).toEqual([]);
  });
});

describe("resumenEnTexto", () => {
  it("dice en qué se fue el dinero, debajo del total", () => {
    const gastos = [
      { importe: 200, categoria: "alojamiento", fecha: "2026-10-01" },
      { importe: 126.5, categoria: "comida", fecha: "2026-10-02" },
    ];
    const lineas = resumenEnTexto({ ...viaje, gastos }).split("\n");
    const i = lineas.indexOf("*En qué se fue*");

    expect(i).toBeGreaterThan(lineas.findIndex((l) => l.includes("Total del viaje")));
    expect(lineas[i + 1]).toBe("· 🛏️ Alojamiento: 200.00 € (61 %)");
    expect(lineas[i + 2]).toBe("· 🍽️ Comida: 126.50 € (39 %)");
  });

  it("sin gastos, sin ese apartado", () => {
    expect(resumenEnTexto(viaje)).not.toContain("En qué se fue");
  });

  it("lleva el nombre y el total", () => {
    const texto = resumenEnTexto(viaje);

    expect(texto).toContain("Lisboa");
    expect(texto).toContain("326.50 €");
  });

  it("lista lo que puso cada uno", () => {
    const texto = resumenEnTexto(viaje);

    expect(texto).toContain("Ana: 240.00 €");
    expect(texto).toContain("Luis: 86.50 €");
    expect(texto).toContain("Marta: 0.00 €");
  });

  it("dice quién le paga a quién", () => {
    const texto = resumenEnTexto(viaje);

    expect(texto).toContain("Marta → Ana");
    expect(texto).toContain("Luis → Ana");
  });

  it("lleva el código para que puedan entrar", () => {
    expect(resumenEnTexto(viaje)).toContain("ABC12345");
  });

  it("y el enlace, en la última línea", () => {
    const texto = resumenEnTexto({ ...viaje, enlace: "https://saldocero.app/#ABC12345" });
    expect(texto.split("\n").at(-1)).toBe("https://saldocero.app/#ABC12345");
  });

  it("sin enlace, acaba en el código", () => {
    expect(resumenEnTexto(viaje).split("\n").at(-1)).toContain("código *ABC12345*");
  });

  it("al lado de lo que puso, lo que le tocaba", () => {
    const texto = resumenEnTexto(viaje);

    expect(texto).toContain("Ana: 240.00 € (le tocaban 108.83 €)");
    expect(texto).toContain("Marta: 0.00 € (le tocaban 108.83 €)");
  });

  it("si puso justo lo suyo, no lo repite", () => {
    const texto = resumenEnTexto({
      ...viaje,
      balances: [{ id: "a", nombre: "Ana", puesto: 50, tocaPagar: 50.004, balance: 0 }],
    });

    expect(texto).toContain("Ana: 50.00 €\n");
    expect(texto).not.toContain("le tocaban");
  });

  it("debajo del nombre, cuándo fue", () => {
    const gastos = [{ fecha: "2026-09-13" }, { fecha: "2026-09-11" }];
    const texto = resumenEnTexto({ ...viaje, gastos });

    expect(texto.startsWith("*Lisboa* 🧳\n📅 Del 11 al 13 de septiembre de 2026\n\n")).toBe(true);
  });

  it("sin gastos con fecha, no pone la línea", () => {
    expect(resumenEnTexto({ ...viaje, gastos: [{}] })).not.toContain("📅");
  });

  it("al lado del total, lo que sale por cabeza", () => {
    expect(resumenEnTexto(viaje)).toContain("Total del viaje: *326.50 €* · 108.83 € por cabeza\n");
  });

  it("si no a todos les toca lo mismo, avisa de que es una media", () => {
    const balances = [
      { id: "a", nombre: "Ana", puesto: 90, tocaPagar: 60, balance: 30 },
      { id: "b", nombre: "Luis", puesto: 0, tocaPagar: 30, balance: -30 },
    ];

    expect(resumenEnTexto({ ...viaje, total: 90, balances })).toContain("45.00 € por cabeza de media");
  });

  it("con uno solo o sin gastos, no lo pone", () => {
    expect(resumenEnTexto({ ...viaje, balances: viaje.balances.slice(0, 1) })).not.toContain("por cabeza");
    expect(resumenEnTexto({ ...viaje, total: 0 })).not.toContain("por cabeza");
  });

  it("respeta la moneda del viaje", () => {
    const texto = resumenEnTexto({ ...viaje, moneda: "GBP" });
    expect(texto).toContain("£326.50");
  });

  it("si no hay deudas, lo dice y ya", () => {
    const texto = resumenEnTexto({ ...viaje, pagos: [] });

    expect(texto).toContain("Cuentas saldadas");
    expect(texto).not.toContain("Quién le paga a quién");
  });

  it("los pagos ya hechos no salen como pendientes", () => {
    const texto = resumenEnTexto({
      ...viaje,
      pagos: [
        { de: "Marta", a: "Ana", cantidad: 108.83, saldado: true },
        { de: "Luis", a: "Ana", cantidad: 22.33, saldado: false },
      ],
    });

    // El pendiente, en la lista de arriba con su importe.
    expect(texto).toContain("· Luis → Ana: *22.33 €*");
    // Y el ya pagado, apartado abajo.
    expect(texto).toContain("Ya pagado: Marta → Ana");
  });

  it("si está todo pagado, no pide pagar nada", () => {
    const texto = resumenEnTexto({
      ...viaje,
      pagos: viaje.pagos.map((p) => ({ ...p, saldado: true })),
    });

    expect(texto).toContain("Todo pagado");
    expect(texto).not.toContain("Quién le paga a quién");
  });

  it("sin cifras, no cambia nada", () => {
    expect(resumenEnTexto({ ...viaje, cifras: "" })).toBe(resumenEnTexto(viaje));
  });

  it("las cifras van antes del pie", () => {
    const texto = resumenEnTexto({ ...viaje, cifras: "*Lisboa* en cifras 📊" });

    expect(texto).toContain("*Lisboa* en cifras 📊");
    expect(texto.indexOf("en cifras")).toBeLessThan(texto.indexOf("Apuntado con SaldoCero"));
  });
});

describe("enlaceDelViaje", () => {
  it("el código va detrás de la almohadilla", () => {
    expect(enlaceDelViaje("ABC12345", "https://saldocero.app/")).toBe(
      "https://saldocero.app/#ABC12345"
    );
  });
});

describe("invitacion", () => {
  const datos = invitacion({ nombre: "Lisboa", codigo: "ABC12345" }, "https://saldocero.app/");

  it("lleva el enlace del viaje", () => {
    expect(datos.url).toBe("https://saldocero.app/#ABC12345");
  });

  it("y el código en el texto, por si hay que escribirlo", () => {
    expect(datos.text).toContain("Lisboa");
    expect(datos.text).toContain("ABC12345");
  });
});

describe("copiarAlPortapapeles", () => {
  it("si copia, vibra un toque", async () => {
    const nav = { clipboard: { writeText: vi.fn().mockResolvedValue() }, vibrate: vi.fn() };

    expect(await copiarAlPortapapeles("ABC123", nav)).toBe(true);
    expect(nav.clipboard.writeText).toHaveBeenCalledWith("ABC123");
    expect(nav.vibrate).toHaveBeenCalledWith(PATRONES.toque);
  });

  it("si no ha podido, no vibra", async () => {
    const nav = { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("x")) }, vibrate: vi.fn() };

    expect(await copiarAlPortapapeles("ABC123", nav)).toBe(false);
    expect(nav.vibrate).not.toHaveBeenCalled();
  });

  // En el iPhone no hay vibrate, y copiar tiene que ir igual.
  it("sin vibración, copia igual", async () => {
    const nav = { clipboard: { writeText: vi.fn().mockResolvedValue() } };

    expect(await copiarAlPortapapeles("ABC123", nav)).toBe(true);
  });
});

describe("invitar", () => {
  const datos = { title: "t", text: "x", url: "https://saldocero.app/#ABC" };
  const portapapeles = () => ({ writeText: vi.fn().mockResolvedValue() });

  it("con menú de compartir, lo usa", async () => {
    const nav = { share: vi.fn().mockResolvedValue(), clipboard: portapapeles() };

    expect(await invitar(datos, nav)).toBe("compartido");
    expect(nav.share).toHaveBeenCalledWith(datos);
    expect(nav.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("si cierras el menú, ni copia ni nada", async () => {
    const cancelado = Object.assign(new Error("x"), { name: "AbortError" });
    const nav = { share: vi.fn().mockRejectedValue(cancelado), clipboard: portapapeles() };

    expect(await invitar(datos, nav)).toBe("cancelado");
    expect(nav.clipboard.writeText).not.toHaveBeenCalled();
  });

  // Por ejemplo, si el navegador no deja compartir desde esa página.
  it("si el menú falla por otra cosa, copia el enlace", async () => {
    const nav = { share: vi.fn().mockRejectedValue(new Error("x")), clipboard: portapapeles() };

    expect(await invitar(datos, nav)).toBe("copiado");
    expect(nav.clipboard.writeText).toHaveBeenCalledWith(datos.url);
  });

  it("sin menú de compartir, copia el enlace", async () => {
    const nav = { clipboard: portapapeles() };

    expect(await invitar(datos, nav)).toBe("copiado");
    expect(nav.clipboard.writeText).toHaveBeenCalledWith(datos.url);
  });

  // El resumen va sin enlace: lo que se copia es el texto entero.
  it("sin enlace, copia el texto", async () => {
    const nav = { clipboard: portapapeles() };

    expect(await invitar({ text: "Lisboa: 326,50 €" }, nav)).toBe("copiado");
    expect(nav.clipboard.writeText).toHaveBeenCalledWith("Lisboa: 326,50 €");
  });

  it("si tampoco se puede copiar, avisa del fallo", async () => {
    const nav = { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("x")) } };

    expect(await invitar(datos, nav)).toBe("fallo");
  });
});

describe("nombreDeArchivo", () => {
  it("lleva el día antes de la extensión", () => {
    expect(nombreDeArchivo("Lisboa", "txt", "2026-09-14")).toBe("Lisboa 2026-09-14.txt");
    expect(nombreDeArchivo("Lisboa - gastos", "csv", "2026-09-14")).toBe("Lisboa - gastos 2026-09-14.csv");
  });

  it("sin día, el de hoy", () => {
    expect(nombreDeArchivo("Lisboa", "txt")).toMatch(/^Lisboa \d{4}-\d{2}-\d{2}\.txt$/);
  });
});

describe("compartirImagen", () => {
  const imagen = new Blob(["png"], { type: "image/png" });

  it("con el menú del móvil, manda el archivo", async () => {
    let mandado;
    const nav = { canShare: () => true, share: async (d) => (mandado = d) };
    expect(await compartirImagen(imagen, "Lisboa.png", nav)).toBe("compartido");
    expect(mandado.files[0].name).toBe("Lisboa.png");
    expect(mandado.files[0].type).toBe("image/png");
  });

  it("si cierras el menú, nada más", async () => {
    const nav = {
      canShare: () => true,
      share: async () => {
        throw Object.assign(new Error(), { name: "AbortError" });
      },
    };
    expect(await compartirImagen(imagen, "Lisboa.png", nav)).toBe("cancelado");
  });
});
