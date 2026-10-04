import { describe, it, expect } from "vitest";
import { avisoDeArranque, codigoQueAbrir } from "./arranque";

function noExiste() {
  const fallo = new Error("Ese código no existe. Míralo otra vez.");
  fallo.noExiste = true;
  return fallo;
}

describe("avisoDeArranque", () => {
  it("si venía de un enlace, habla del enlace", () => {
    expect(avisoDeArranque(noExiste(), true)).toMatch(/Ese enlace no lleva a ningún viaje/);
  });

  it("si era el último viaje, lo dice", () => {
    expect(avisoDeArranque(noExiste(), false)).toBe("El último viaje en el que estuviste ya no existe.");
  });

  it("si es otra cosa, como no tener conexión, deja su mensaje", () => {
    const fallo = new Error("No hemos podido conectar. Revisa tu conexión.");
    expect(avisoDeArranque(fallo, true)).toBe("No hemos podido conectar. Revisa tu conexión.");
  });

  it("sin mensaje, uno genérico", () => {
    expect(avisoDeArranque(undefined, false)).toBe("No hemos podido abrir el viaje.");
  });
});

describe("codigoQueAbrir", () => {
  it("si el enlace es de otro viaje, ese", () => {
    expect(codigoQueAbrir("#OTRO2345", "ABCD2345")).toBe("OTRO2345");
  });

  it("si es el mismo viaje, nada", () => {
    expect(codigoQueAbrir("#ABCD2345", "ABCD2345")).toBe(null);
    expect(codigoQueAbrir("#abcd2345", "ABCD2345")).toBe(null);
  });

  it("sin código en el enlace, como al salir, nada", () => {
    expect(codigoQueAbrir("", "ABCD2345")).toBe(null);
    expect(codigoQueAbrir("#", "ABCD2345")).toBe(null);
  });

  it("fuera de un viaje, cualquiera vale", () => {
    expect(codigoQueAbrir("#OTRO2345", undefined)).toBe("OTRO2345");
  });
});
