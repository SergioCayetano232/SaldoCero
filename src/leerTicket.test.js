import { describe, it, expect } from "vitest";
import { totalDelTicket, totalComoTexto, medidaParaLeer } from "./leerTicket";

describe("totalDelTicket", () => {
  it("la línea del total", () => {
    const ticket = `RESTAURANTE LA PLAZA
CIF B12345678
2 CAÑAS          5,00
1 BRAVAS         6,50
TOTAL           11,50
EFECTIVO        20,00
CAMBIO           8,50`;
    expect(totalDelTicket(ticket)).toBe(11.5);
  });

  it("sin confundirse con el subtotal ni el IVA", () => {
    const ticket = `SUBTOTAL 41,32
IVA 10% 4,13
TOTAL EUR 45,45`;
    expect(totalDelTicket(ticket)).toBe(45.45);
  });

  it("con el IVA incluido, sigue siendo el total", () => {
    expect(totalDelTicket("TOTAL (IVA INCL.) 45,45\nIVA 10% 4,13")).toBe(45.45);
    expect(totalDelTicket("Total IVA incluido 18,00")).toBe(18);
  });

  it("con miles y punto", () => {
    expect(totalDelTicket("Importe total: 1.234,56 €")).toBe(1234.56);
    expect(totalDelTicket("TOTAL 12.50")).toBe(12.5);
  });

  it("con los fallos típicos del OCR", () => {
    expect(totalDelTicket("TOTAL 2O,5O")).toBe(20.5);
    expect(totalDelTicket("TOTAL 1S,90")).toBe(15.9);
    expect(totalDelTicket("TOTAL 12 ,50")).toBe(12.5);
  });

  it("si hay dos totales, el último", () => {
    const ticket = `TOTAL 30,00
Propina 3,00
TOTAL A PAGAR 33,00`;
    expect(totalDelTicket(ticket)).toBe(33);
  });

  it("sin línea de total, lo más alto que no sea el cambio", () => {
    const ticket = `PAN 1,20
LECHE 0,95
QUESO 4,80
ENTREGADO 10,00`;
    expect(totalDelTicket(ticket)).toBe(4.8);
  });

  it("los números sin céntimos no cuentan: horas, CIF, cantidades", () => {
    expect(totalDelTicket("Mesa 12  Hora 21:45\nTOTAL 37,80")).toBe(37.8);
    expect(totalDelTicket("Mesa 12 Hora 21:45")).toBeNull();
  });

  it("sin nada que leer, null", () => {
    expect(totalDelTicket("")).toBeNull();
    expect(totalDelTicket(null)).toBeNull();
  });
});

describe("totalComoTexto", () => {
  it("con coma", () => {
    expect(totalComoTexto(11.5)).toBe("11,5");
    expect(totalComoTexto(20)).toBe("20");
  });
});

describe("medidaParaLeer", () => {
  it("una foto pequeña se agranda", () => {
    expect(medidaParaLeer(400, 600)).toEqual({ ancho: 1067, alto: 1600 });
    expect(medidaParaLeer(380, 300)).toEqual({ ancho: 1200, alto: 947 });
  });

  it("una del móvil se encoge", () => {
    expect(medidaParaLeer(3000, 4000)).toEqual({ ancho: 1200, alto: 1600 });
  });
});
