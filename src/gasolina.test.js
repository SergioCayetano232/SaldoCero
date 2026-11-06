import { describe, it, expect } from "vitest";
import { costeGasolina, comoImporte, cocheGuardado, guardarCoche } from "./gasolina";

function almacenDePrueba(inicial = {}) {
  const datos = { ...inicial };
  return {
    getItem: (k) => datos[k] ?? null,
    setItem: (k, v) => {
      datos[k] = String(v);
    },
  };
}

describe("costeGasolina", () => {
  it("km por consumo por precio del litro", () => {
    // 300 km a 6 l/100 son 18 litros, a 1,60 → 28,80
    expect(costeGasolina({ km: "300", consumo: "6", precio: "1,60" })).toBe(28.8);
  });

  it("ida y vuelta, el doble", () => {
    expect(costeGasolina({ km: "300", consumo: "6", precio: "1,60", idaYVuelta: true })).toBe(57.6);
  });

  it("entiende coma y punto, y el litro con tres decimales", () => {
    expect(costeGasolina({ km: "125,5", consumo: "5.4", precio: "1,659" })).toBe(11.24);
  });

  it("redondea a céntimos", () => {
    expect(costeGasolina({ km: "33", consumo: "7", precio: "1,555" })).toBe(3.59);
  });

  it("si falta algo o no se entiende, null", () => {
    expect(costeGasolina({ km: "", consumo: "6", precio: "1,6" })).toBeNull();
    expect(costeGasolina({ km: "300", consumo: "", precio: "1,6" })).toBeNull();
    expect(costeGasolina({ km: "300", consumo: "6", precio: "abc" })).toBeNull();
    expect(costeGasolina({ km: "0", consumo: "6", precio: "1,6" })).toBeNull();
    expect(costeGasolina({ km: "-50", consumo: "6", precio: "1,6" })).toBeNull();
  });

  it("un trayecto tan corto que no llega al céntimo, null", () => {
    expect(costeGasolina({ km: "0,01", consumo: "1", precio: "1" })).toBeNull();
  });
});

describe("comoImporte", () => {
  it("con coma", () => {
    expect(comoImporte(28.8)).toBe("28,8");
    expect(comoImporte(11.24)).toBe("11,24");
    expect(comoImporte(30)).toBe("30");
  });
});

describe("el coche guardado", () => {
  it("vacío la primera vez", () => {
    expect(cocheGuardado(almacenDePrueba())).toEqual({ consumo: "", precio: "" });
  });

  it("se acuerda de lo último", () => {
    const almacen = almacenDePrueba();
    guardarCoche({ consumo: "6,5", precio: "1,62" }, almacen);
    expect(cocheGuardado(almacen)).toEqual({ consumo: "6,5", precio: "1,62" });
  });

  it("si lo han tocado a mano y no es JSON, vacío", () => {
    expect(cocheGuardado(almacenDePrueba({ "saldocero-gasolina": "{roto" }))).toEqual({ consumo: "", precio: "" });
  });

  it("si trae otra cosa, lo ignora", () => {
    expect(cocheGuardado(almacenDePrueba({ "saldocero-gasolina": '{"consumo":6}' }))).toEqual({ consumo: "", precio: "" });
  });

  it("sin almacén, ni falla", () => {
    expect(cocheGuardado(null)).toEqual({ consumo: "", precio: "" });
    expect(() => guardarCoche({ consumo: "6", precio: "1" }, null)).not.toThrow();
  });

  it("si el almacén falla al guardar, no rompe", () => {
    const roto = { getItem: () => null, setItem: () => { throw new Error("lleno"); } };
    expect(() => guardarCoche({ consumo: "6", precio: "1" }, roto)).not.toThrow();
  });
});
