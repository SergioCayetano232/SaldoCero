import { describe, it, expect } from "vitest";
import { medidaReducida, rutaDelTicket, esImagen, LADO_MAXIMO, urlParaBajar, MAXIMO_FOTOS, fotosDeGasto, cabeOtraFoto, sinLaFoto } from "./tickets";

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

describe("urlParaBajar", () => {
  const firmada = "https://x.supabase.co/storage/v1/object/sign/tickets/v/g.jpg?token=abc";

  it("le pide a Supabase que la mande como archivo, con el concepto", () => {
    const url = new URL(urlParaBajar(firmada, "Cena"));
    expect(url.searchParams.get("token")).toBe("abc");
    expect(url.searchParams.get("download")).toBe("Ticket Cena.jpg");
  });

  it("las tildes y los espacios no rompen la dirección", () => {
    const url = new URL(urlParaBajar(firmada, "Café & churros"));
    expect(url.searchParams.get("download")).toBe("Ticket Café & churros.jpg");
  });

  it("sin barras en el nombre", () => {
    expect(new URL(urlParaBajar(firmada, "ida/vuelta")).searchParams.get("download")).toBe("Ticket ida-vuelta.jpg");
  });

  it("sin concepto, un nombre igual", () => {
    expect(new URL(urlParaBajar(firmada, "")).searchParams.get("download")).toBe("Ticket del gasto.jpg");
  });
});

describe("varias fotos", () => {
  const gasto = { ticket: "v/g-1.jpg", masTickets: ["v/g-2.jpg", "v/g-3.jpg"] };

  it("todas, la primera delante", () => {
    expect(fotosDeGasto(gasto)).toEqual(["v/g-1.jpg", "v/g-2.jpg", "v/g-3.jpg"]);
  });

  it("los gastos de antes no traen las de más", () => {
    expect(fotosDeGasto({ ticket: "v/g-1.jpg" })).toEqual(["v/g-1.jpg"]);
    expect(fotosDeGasto({ ticket: null })).toEqual([]);
  });

  it("cabe otra hasta llegar al máximo, y sin la primera no", () => {
    expect(cabeOtraFoto(gasto)).toBe(true);
    expect(cabeOtraFoto({ ...gasto, masTickets: ["a", "b", "c"] })).toBe(false);
    expect(cabeOtraFoto({ ticket: null })).toBe(false);
    expect(MAXIMO_FOTOS).toBe(4);
  });

  it("quitar una de las de más", () => {
    expect(sinLaFoto(gasto, "v/g-2.jpg")).toEqual({ ticket: "v/g-1.jpg", masTickets: ["v/g-3.jpg"] });
  });

  it("quitar la primera sube la siguiente", () => {
    expect(sinLaFoto(gasto, "v/g-1.jpg")).toEqual({ ticket: "v/g-2.jpg", masTickets: ["v/g-3.jpg"] });
  });

  it("quitar la única deja el gasto sin foto", () => {
    expect(sinLaFoto({ ticket: "v/g-1.jpg" }, "v/g-1.jpg")).toEqual({ ticket: null, masTickets: [] });
  });
});
