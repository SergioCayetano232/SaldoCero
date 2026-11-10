import { describe, it, expect } from "vitest";
import { totalDelTicket, totalComoTexto, medidaParaLeer, fechaDelTicket, platosDelTicket } from "./leerTicket";

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

  it("un ticket en inglés", () => {
    const ticket = `THE RED LION PUB
2 PINTS          11.00
FISH & CHIPS     14.50
SUBTOTAL         25.50
VAT 20%           4.25
TOTAL            25.50
CASH             30.00
CHANGE            4.50`;
    expect(totalDelTicket(ticket)).toBe(25.5);
  });

  it("en inglés, con amount due o balance due", () => {
    expect(totalDelTicket("Subtotal 18.00\nTax 1.44\nAmount due 19.44")).toBe(19.44);
    expect(totalDelTicket("Balance due: £42.10")).toBe(42.1);
  });

  it("en inglés, con el impuesto incluido sigue siendo el total", () => {
    expect(totalDelTicket("TOTAL INC VAT 36.00\nVAT 6.00")).toBe(36);
    expect(totalDelTicket("Total (VAT included) 12.80")).toBe(12.8);
  });

  it("en inglés, sin la propina sugerida", () => {
    const ticket = `TOTAL 40.00
Suggested tip 18%: total 47.20`;
    expect(totalDelTicket(ticket)).toBe(40);
  });

  it("con miles a la inglesa", () => {
    expect(totalDelTicket("TOTAL 1,234.50")).toBe(1234.5);
    expect(totalDelTicket("Grand total $2,045.00")).toBe(2045);
  });

  it("sin línea de total en inglés, lo más alto que no sea lo que diste", () => {
    expect(totalDelTicket("MILK 1.20\nBREAD 2.10\nCASH 10.00\nCHANGE 6.70")).toBe(2.1);
  });

  it("sin nada que leer, null", () => {
    expect(totalDelTicket("")).toBeNull();
    expect(totalDelTicket(null)).toBeNull();
  });
});

describe("fechaDelTicket", () => {
  const hoyEs = "2026-11-05";
  const leer = (texto) => fechaDelTicket(texto, hoyEs);

  it("con barras, guiones o puntos, y el año entero o en corto", () => {
    expect(leer("FECHA: 03/11/2026 14:32")).toBe("2026-11-03");
    expect(leer("3-11-26")).toBe("2026-11-03");
    expect(leer("03.11.2026")).toBe("2026-11-03");
    expect(leer("2026-11-03 21:05")).toBe("2026-11-03");
  });

  it("sin año no es una fecha, que es un precio", () => {
    expect(leer("CAFE 12.50\nTOTAL 03/11")).toBeNull();
  });

  it("con las O del OCR por ceros", () => {
    expect(leer("Fecha O3/11/2O26")).toBe("2026-11-03");
  });

  it("la de la línea que dice fecha antes que otra", () => {
    expect(leer("Vale hasta 01/10/2026\nFecha: 02/11/2026")).toBe("2026-11-02");
  });

  it("también la de la línea que dice date", () => {
    expect(fechaDelTicket("Printed 01/11/2026\nDate: 02/11/2026", "2026-11-10")).toBe("2026-11-02");
  });

  it("si no, la primera", () => {
    expect(leer("Mesa 4  01/11/2026\nVálido hasta 30/10/2026")).toBe("2026-11-01");
  });

  it("ni del futuro, ni de hace más de un año, ni días que no existen", () => {
    expect(leer("10/12/2026")).toBeNull();
    expect(leer("03/11/2024")).toBeNull();
    expect(leer("31/02/2026")).toBeNull();
    expect(leer("Caduca 10/12/2026\n03/11/2026")).toBe("2026-11-03");
  });

  it("el CIF o el teléfono no son fechas", () => {
    expect(leer("CIF B12345678\nTel 912 345 678")).toBeNull();
  });

  it("sin texto, nada", () => {
    expect(leer("")).toBeNull();
    expect(leer(null)).toBeNull();
  });
});

describe("platosDelTicket", () => {
  it("cada línea con precio, hasta el total", () => {
    const ticket = `RESTAURANTE LA PLAZA
CIF B12345678
Fecha 03.11.2026  Hora 21:45
2 CAÑAS          5,00
1 BRAVAS         6,50
SECRETO IBÉRICO 14,90
TOTAL           26,40
EFECTIVO        30,00
CAMBIO           3,60`;
    expect(platosDelTicket(ticket)).toEqual([
      { nombre: "2 cañas", importe: 5 },
      { nombre: "1 bravas", importe: 6.5 },
      { nombre: "Secreto ibérico", importe: 14.9 },
    ]);
  });

  it("con cantidad y precio por unidad, el de la línea", () => {
    expect(platosDelTicket("2 x 2,50 CAFÉ 5,00\nTOTAL 5,00")).toEqual([{ nombre: "Café", importe: 5 }]);
  });

  it("sin el IVA, la base ni los descuentos", () => {
    const ticket = `PIZZA 12,00
BASE IMPONIBLE 10,91
IVA 10% 1,09
DESCUENTO 2,00
AGUA 2,00`;
    expect(platosDelTicket(ticket).map((p) => p.nombre)).toEqual(["Pizza", "Agua"]);
  });

  it("en inglés, parando en el subtotal", () => {
    const ticket = `THE RED LION PUB
2 PINTS          11.00
FISH & CHIPS     14.50
SUBTOTAL         25.50
VAT 20%           4.25`;
    expect(platosDelTicket(ticket)).toEqual([
      { nombre: "2 pints", importe: 11 },
      { nombre: "Fish & chips", importe: 14.5 },
    ]);
  });

  it("los nombres en minúscula se quedan como están", () => {
    expect(platosDelTicket("Tarta de queso 6,50")).toEqual([{ nombre: "Tarta de queso", importe: 6.5 }]);
  });

  it("una línea sin nombre no es un plato", () => {
    expect(platosDelTicket("12,50\n€ 3,00\nPAN 1,20")).toEqual([{ nombre: "Pan", importe: 1.2 }]);
  });

  it("sin texto, ninguno", () => {
    expect(platosDelTicket("")).toEqual([]);
    expect(platosDelTicket(undefined)).toEqual([]);
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
