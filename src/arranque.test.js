import { describe, it, expect } from "vitest";
import { avisoDeArranque } from "./arranque";

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
