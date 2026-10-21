import { describe, it, expect } from "vitest";
import { codigoDeTexto, codigoDelPortapapeles } from "./codigos";

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

describe("codigoDeTexto con la invitación sin enlace", () => {
  it("saca el código de detrás de \"código:\"", () => {
    const texto = 'Apunta aquí lo que pagues en "Lisboa". Si te pide código: abcd2345';
    expect(codigoDeTexto(texto)).toBe("ABCD2345");
  });

  it("aunque lo escriban sin tilde o con guion", () => {
    expect(codigoDeTexto("codigo: ABCD-2345")).toBe("ABCD2345");
  });

  it("si trae enlace, manda el enlace", () => {
    expect(codigoDeTexto("código: AAAA1111 https://x.app/#BBBB2222")).toBe("BBBB2222");
  });
});

describe("codigoDelPortapapeles", () => {
  const conTexto = (texto) => ({ clipboard: { readText: () => Promise.resolve(texto) } });

  it("lee lo copiado y saca el código", async () => {
    expect(await codigoDelPortapapeles(conTexto("https://x.app/#abcd2345"))).toBe("ABCD2345");
  });

  it("sin permiso, vacío", async () => {
    const nav = { clipboard: { readText: () => Promise.reject(new Error("denegado")) } };
    expect(await codigoDelPortapapeles(nav)).toBe("");
  });

  it("donde no se puede leer, vacío", async () => {
    expect(await codigoDelPortapapeles({})).toBe("");
  });

  it("con el portapapeles vacío, vacío", async () => {
    expect(await codigoDelPortapapeles(conTexto(""))).toBe("");
  });
});
