import { describe, it, expect, afterEach } from "vitest";
import { esperaDeLasDeudas, DIAS_PARA_DECIRLO, DIAS_PARA_AVISAR } from "./esperando";
import { usarIdioma } from "./idioma";

const DIA = 86400000;
const ahora = Date.parse("2026-11-12T12:00:00");
const haceDias = (n) => new Date(ahora - n * DIA).toISOString();

describe("esperaDeLasDeudas", () => {
  afterEach(() => usarIdioma("es"));

  it("con el viaje abierto, nada", () => {
    expect(esperaDeLasDeudas(null, 30, ahora)).toBeNull();
    expect(esperaDeLasDeudas(undefined, 30, ahora)).toBeNull();
  });

  it("sin nada pendiente, nada", () => {
    expect(esperaDeLasDeudas(haceDias(20), 0, ahora)).toBeNull();
  });

  it("recién cerrado, todavía no se dice", () => {
    expect(esperaDeLasDeudas(haceDias(DIAS_PARA_DECIRLO - 1), 30, ahora)).toBeNull();
  });

  it("a los tres días ya sale, sin avisar", () => {
    expect(esperaDeLasDeudas(haceDias(3), 30, ahora)).toEqual({ dias: 3, cuando: "hace 3 días", texto: "cerrado hace 3 días y sin pagar", avisar: false });
  });

  it("a las dos semanas, con aviso", () => {
    const espera = esperaDeLasDeudas(haceDias(DIAS_PARA_AVISAR), 30, ahora);
    expect(espera.avisar).toBe(true);
    expect(espera.texto).toBe("cerrado hace 2 semanas y sin pagar");
  });

  it("con un mes", () => {
    expect(esperaDeLasDeudas(haceDias(40), 30, ahora).texto).toBe("cerrado hace un mes y sin pagar");
  });

  it("con el reloj del móvil atrasado, como recién cerrado", () => {
    expect(esperaDeLasDeudas(haceDias(-5), 30, ahora)).toBeNull();
  });

  it("una fecha que no se entiende, nada", () => {
    expect(esperaDeLasDeudas("ayer", 30, ahora)).toBeNull();
  });

  it("en inglés", () => {
    usarIdioma("en");
    expect(esperaDeLasDeudas(haceDias(3), 30, ahora).texto).toBe("closed 3 days ago, still unpaid");
  });
});
