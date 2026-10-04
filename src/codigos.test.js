import { describe, it, expect } from "vitest";
import { codigoDeTexto } from "./codigos";

describe("codigoDeTexto", () => {
  it("deja como está un código bien escrito", () => {
    expect(codigoDeTexto("ABCD2345")).toBe("ABCD2345");
  });

  it("lo pasa a mayúsculas", () => {
    expect(codigoDeTexto("abcd2345")).toBe("ABCD2345");
  });

  it("quita espacios, guiones y puntos", () => {
    expect(codigoDeTexto("  abcd 2345 ")).toBe("ABCD2345");
    expect(codigoDeTexto("ABCD-2345")).toBe("ABCD2345");
    expect(codigoDeTexto("ABCD.2345")).toBe("ABCD2345");
  });

  it("saca el código del enlace entero", () => {
    expect(codigoDeTexto("https://saldo-cero-eight.vercel.app/#ABCD2345")).toBe("ABCD2345");
  });

  it("y del mensaje de invitación con el enlace dentro", () => {
    const mensaje = "Únete a Lisboa: https://saldo-cero-eight.vercel.app/#abcd2345 ¡nos vemos!";
    expect(codigoDeTexto(mensaje)).toBe("ABCD2345");
  });

  it("vacío o nada, vacío", () => {
    expect(codigoDeTexto("")).toBe("");
    expect(codigoDeTexto(null)).toBe("");
    expect(codigoDeTexto("   ")).toBe("");
  });
});
