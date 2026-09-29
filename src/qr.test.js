import { describe, it, expect } from "vitest";
import { caminoDelQR, qrDelEnlace } from "./qr";

// Una matriz pequeña escrita a mano: # es oscuro.
function matriz(filas) {
  return (x, y) => filas[y][x] === "#";
}

describe("caminoDelQR", () => {
  it("un cuadradito suelto", () => {
    expect(caminoDelQR(2, matriz(["#.", ".."]))).toBe("M0 0h1v1h-1z");
  });

  it("los seguidos de una fila van en un solo rectángulo", () => {
    expect(caminoDelQR(3, matriz(["###", "...", "..."]))).toBe("M0 0h3v1h-3z");
  });

  it("un hueco en medio los separa", () => {
    expect(caminoDelQR(3, matriz(["#.#", "...", "..."]))).toBe("M0 0h1v1h-1zM2 0h1v1h-1z");
  });

  it("cada fila en su altura", () => {
    expect(caminoDelQR(2, matriz(["..", ".#"]))).toBe("M1 1h1v1h-1z");
  });

  it("todo claro, nada que pintar", () => {
    expect(caminoDelQR(2, matriz(["..", ".."]))).toBe("");
  });
});

describe("qrDelEnlace", () => {
  const qr = qrDelEnlace("https://saldocero.app/#LSB42XYZ");

  // El más pequeño que existe es de 21x21, y siempre crece de 4 en 4.
  it("tiene un tamaño de QR de verdad", () => {
    expect(qr.tamano).toBeGreaterThanOrEqual(21);
    expect((qr.tamano - 21) % 4).toBe(0);
  });

  // Las tres esquinas con el cuadrado grande: arriba a la izquierda empieza por una fila de 7.
  it("empieza por la esquina de arriba a la izquierda", () => {
    expect(qr.camino.startsWith("M0 0h7v1h-7z")).toBe(true);
  });

  it("el mismo enlace da el mismo QR", () => {
    expect(qrDelEnlace("https://saldocero.app/#LSB42XYZ")).toEqual(qr);
  });
});
