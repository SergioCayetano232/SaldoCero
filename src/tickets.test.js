import { describe, it, expect } from "vitest";
import { medidaReducida, rutaDelTicket, esImagen, LADO_MAXIMO } from "./tickets";

describe("medidaReducida", () => {
  it("una foto vertical del móvil baja a 1600 de alto", () => {
    expect(medidaReducida(3024, 4032)).toEqual({ ancho: 1200, alto: 1600 });
  });

  it("y una horizontal, a 1600 de ancho", () => {
    expect(medidaReducida(4032, 3024)).toEqual({ ancho: 1600, alto: 1200 });
  });

  it("si ya es pequeña, se queda como está", () => {
    expect(medidaReducida(800, 600)).toEqual({ ancho: 800, alto: 600 });
    expect(medidaReducida(LADO_MAXIMO, 10)).toEqual({ ancho: LADO_MAXIMO, alto: 10 });
  });

  it("un ticket largo y estrecho no se queda en nada", () => {
    expect(medidaReducida(600, 6000)).toEqual({ ancho: 160, alto: 1600 });
  });
});

describe("rutaDelTicket", () => {
  it("en la carpeta del viaje, con el gasto en el nombre", () => {
    expect(rutaDelTicket("viaje-1", "gasto-9", "abcdef1234567890")).toBe("viaje-1/gasto-9-abcdef12.jpg");
  });

  it("dos fotos del mismo gasto no se llaman igual", () => {
    expect(rutaDelTicket("v", "g")).not.toBe(rutaDelTicket("v", "g"));
  });
});

describe("esImagen", () => {
  it("las fotos sí", () => {
    expect(esImagen({ type: "image/jpeg" })).toBe(true);
    expect(esImagen({ type: "image/heic" })).toBe(true);
  });

  it("un pdf o nada, no", () => {
    expect(esImagen({ type: "application/pdf" })).toBe(false);
    expect(esImagen(null)).toBe(false);
  });
});
