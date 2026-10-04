import { describe, it, expect } from "vitest";
import { limpiarNombre, nombreNuevo, nombreRepetido, LARGO_MAXIMO } from "./nombres";

describe("limpiarNombre", () => {
  it("quita espacios de sobra", () => {
    expect(limpiarNombre("  Javier   López ")).toBe("Javier López");
  });

  it("vacío o solo espacios, null", () => {
    expect(limpiarNombre("")).toBeNull();
    expect(limpiarNombre("    ")).toBeNull();
    expect(limpiarNombre(undefined)).toBeNull();
  });

  it("corta los que no caben", () => {
    expect(limpiarNombre("a".repeat(60))).toHaveLength(LARGO_MAXIMO);
  });

  it("al cortar no deja un espacio al final", () => {
    const nombre = "a".repeat(LARGO_MAXIMO - 1) + " b";
    expect(limpiarNombre(nombre)).toBe("a".repeat(LARGO_MAXIMO - 1));
  });
});

describe("nombreNuevo", () => {
  it("el nombre limpio si ha cambiado", () => {
    expect(nombreNuevo(" Javier ", "Jvier")).toBe("Javier");
  });

  it("si es el mismo, nada que guardar", () => {
    expect(nombreNuevo("Javier  ", "Javier")).toBeNull();
  });

  it("cambiar solo mayúsculas sí cuenta", () => {
    expect(nombreNuevo("javier", "Javier")).toBe("javier");
  });

  it("no se deja a nadie sin nombre", () => {
    expect(nombreNuevo("   ", "Javier")).toBeNull();
  });
});

describe("nombreRepetido", () => {
  const viajeros = [{ id: "a", nombre: "Ana" }, { id: "l", nombre: "Luis" }];

  it("pilla el mismo nombre y dice cuál", () => {
    expect(nombreRepetido("Luis", viajeros)).toBe("Luis");
  });

  it("aunque cambien mayúsculas o tildes", () => {
    expect(nombreRepetido("luis", viajeros)).toBe("Luis");
    expect(nombreRepetido("Luís", viajeros)).toBe("Luis");
    expect(nombreRepetido("ANA", viajeros)).toBe("Ana");
  });

  it("con la inicial del apellido ya es otro", () => {
    expect(nombreRepetido("Luis G.", viajeros)).toBe(null);
  });

  it("sin viajeros no hay repetidos", () => {
    expect(nombreRepetido("Luis", [])).toBe(null);
  });
});
