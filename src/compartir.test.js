import { describe, it, expect, vi } from "vitest";
import { resumenEnTexto, enlaceDelViaje, invitacion, invitar } from "./compartir";

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

describe("resumenEnTexto", () => {
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
