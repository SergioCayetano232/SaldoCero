import { describe, it, expect } from "vitest";
import { cifrasDelViaje, cifrasEnTexto } from "./cifras";
import { BOTE } from "./bote";

const personas = [
  { id: "a", nombre: "Ana", puesto: 150 },
  { id: "b", nombre: "Luis", puesto: 60 },
  { id: "c", nombre: "Marta", puesto: 30 },
];

const gastos = [
  { pagadorId: "a", importe: 120, concepto: "Hotel", categoria: "alojamiento", fecha: "2026-09-10" },
  { pagadorId: "b", importe: 40, concepto: "Cena", categoria: "comida", fecha: "2026-09-10" },
  { pagadorId: "a", importe: 30, concepto: "Museo", categoria: "ocio", fecha: "2026-09-11" },
  { pagadorId: "c", importe: 30, concepto: "Comida", categoria: "comida", fecha: "2026-09-12" },
  { pagadorId: "b", importe: 20, concepto: "Taxi", categoria: "transporte", fecha: "2026-09-12" },
];

describe("cifrasDelViaje", () => {
  const cifras = cifrasDelViaje(gastos, personas);

  it("total, gastos y días", () => {
    expect(cifras.total).toBe(240);
    expect(cifras.gastos).toBe(5);
    expect(cifras.dias).toBe(3);
  });

  it("la media por gasto", () => {
    expect(cifras.media).toBe(48);
    expect(cifrasDelViaje(gastos.slice(0, 1), personas).media).toBeNull();
  });

  it("la media por persona y día", () => {
    // 240 entre 3 personas y 3 días.
    expect(cifras.porPersonaYDia).toBeCloseTo(26.67);
  });

  it("el día más caro", () => {
    expect(cifras.diaMasCaro).toEqual({ fecha: "2026-09-10", total: 160 });
  });

  it("el día más barato", () => {
    expect(cifras.diaMasBarato).toEqual({ fecha: "2026-09-11", total: 30 });
  });

  it("si todos los días costaron lo mismo, no hay día más barato", () => {
    const iguales = [
      { pagadorId: "a", importe: 50, concepto: "Cena", fecha: "2026-09-10" },
      { pagadorId: "b", importe: 50, concepto: "Cena", fecha: "2026-09-11" },
    ];
    expect(cifrasDelViaje(iguales, personas).diaMasBarato).toBeNull();
  });

  it("el gasto más gordo, con quién lo pagó", () => {
    expect(cifras.gastoMasGrande).toEqual({ concepto: "Hotel", importe: 120, quien: "Ana" });
  });

  it("el gasto más pequeño, con quién lo pagó", () => {
    expect(cifras.gastoMasPequeno).toEqual({ concepto: "Taxi", importe: 20, quien: "Luis" });
  });

  it("si todos costaron lo mismo, no hay más pequeño", () => {
    const iguales = gastos.map((g) => ({ ...g, importe: 10 }));
    expect(cifrasDelViaje(iguales, personas).gastoMasPequeno).toBeNull();
    expect(cifrasDelViaje(gastos.slice(0, 1), personas).gastoMasPequeno).toBeNull();
  });

  it("el más pequeño también va por lo convertido", () => {
    const enDolares = [...gastos, { pagadorId: "a", importe: 21, importeConvertido: 19, concepto: "Bus", fecha: "2026-09-12" }];
    expect(cifrasDelViaje(enDolares, personas).gastoMasPequeno.concepto).toBe("Bus");
  });

  it("quién puso más", () => {
    expect(cifras.quienMasPuso.nombre).toBe("Ana");
  });

  it("quién pagó más veces, aunque no sea quien más puso", () => {
    const otroTaxi = [...gastos, { pagadorId: "b", importe: 10, concepto: "Bus", fecha: "2026-09-12" }];
    expect(cifrasDelViaje(otroTaxi, personas).quienMasVeces).toMatchObject({ nombre: "Luis", veces: 3 });
  });

  it("si empatan a veces, nadie", () => {
    // Ana y Luis, dos cada uno.
    expect(cifras.quienMasVeces).toBeNull();
  });

  it("pagar una vez no es pagar más veces", () => {
    expect(cifrasDelViaje(gastos.slice(0, 1), personas).quienMasVeces).toBeNull();
  });

  it("lo del bote no cuenta como de nadie", () => {
    const delBote = gastos.map((g) => ({ ...g, pagadorId: BOTE }));
    expect(cifrasDelViaje(delBote, personas).quienMasVeces).toBeNull();
  });

  it("la categoría que más se llevó, con su porcentaje", () => {
    expect(cifras.categoria).toMatchObject({ id: "alojamiento", total: 120, porcentaje: 50 });
  });

  it("cuenta lo convertido, no lo que se pagó en otra moneda", () => {
    const enDirhams = [{ ...gastos[0], importe: 1300, importeConvertido: 120 }];
    expect(cifrasDelViaje(enDirhams, personas).total).toBe(120);
  });

  it("quién puso menos", () => {
    expect(cifras.quienMenosPuso).toMatchObject({ nombre: "Marta", puesto: 30 });
  });

  it("si empatan los que menos pusieron, no se señala a nadie", () => {
    const empate = personas.map((p) => (p.id === "b" ? { ...p, puesto: 30 } : p));
    expect(cifrasDelViaje(gastos, empate).quienMenosPuso).toBeNull();
  });

  it("si todos pusieron lo mismo, tampoco", () => {
    const iguales = personas.map((p) => ({ ...p, puesto: 80 }));
    expect(cifrasDelViaje(gastos, iguales).quienMenosPuso).toBeNull();
  });

  it("el que no puso nada también cuenta como el que menos", () => {
    const sinPoner = [...personas, { id: "d", nombre: "Óscar", puesto: 0 }];
    expect(cifrasDelViaje(gastos, sinPoner).quienMenosPuso.nombre).toBe("Óscar");
  });

  it("el día más movido, aunque no sea el más caro", () => {
    const otroTaxi = [...gastos, { pagadorId: "b", importe: 5, concepto: "Bus", fecha: "2026-09-12" }];
    expect(cifrasDelViaje(otroTaxi, personas).diaMasMovido).toMatchObject({ fecha: "2026-09-12", gastos: 3 });
  });

  it("si empatan en gastos, no hay día más movido", () => {
    // El 10 y el 12 llevan dos cada uno.
    expect(cifras.diaMasMovido).toBeNull();
  });

  it("con un solo día, tampoco", () => {
    expect(cifrasDelViaje(gastos.slice(0, 2), personas).diaMasMovido).toBeNull();
  });

  it("lo que más se repitió, con las veces y lo que costó", () => {
    const cafes = [
      ...gastos,
      { pagadorId: "a", importe: 1.5, concepto: "Café", fecha: "2026-09-10" },
      { pagadorId: "b", importe: 1.8, concepto: "cafe ", fecha: "2026-09-11" },
      { pagadorId: "c", importe: 1.2, concepto: "CAFÉ", fecha: "2026-09-12" },
    ];
    expect(cifrasDelViaje(cafes, personas).masRepetido).toEqual({ concepto: "Café", veces: 3, total: 4.5 });
  });

  it("si nada se repite, o empatan, no hay más repetido", () => {
    expect(cifras.masRepetido).toBeNull();
    const empate = [...gastos, { ...gastos[0] }, { ...gastos[1] }];
    expect(cifrasDelViaje(empate, personas).masRepetido).toBeNull();
  });

  it("los conceptos que salen al dejarlo vacío no cuentan", () => {
    const vacios = [
      ...gastos,
      { pagadorId: "a", importe: 5, concepto: "Gasto", categoria: "otros", fecha: "2026-09-10" },
      { pagadorId: "a", importe: 5, concepto: "Gasto", categoria: "otros", fecha: "2026-09-11" },
      { pagadorId: "a", importe: 9, concepto: "Comida", categoria: "comida", fecha: "2026-09-11" },
    ];
    expect(cifrasDelViaje(vacios, personas).masRepetido).toBeNull();
  });

  it("lo repetido suma lo convertido", () => {
    const enDolares = [
      { pagadorId: "a", importe: 11, importeConvertido: 10, concepto: "Taxi", fecha: "2026-09-10" },
      { pagadorId: "a", importe: 22, importeConvertido: 20, concepto: "Taxi", fecha: "2026-09-11" },
    ];
    expect(cifrasDelViaje(enDolares, personas).masRepetido.total).toBe(30);
  });

  it("si lo pagó el bote, lo dice", () => {
    const delBote = [{ ...gastos[0], pagadorId: BOTE }];
    expect(cifrasDelViaje(delBote, personas).gastoMasGrande.quien).toBe("el bote");
  });

  it("si todos pusieron lo mismo, no hay ganador", () => {
    const iguales = personas.map((p) => ({ ...p, puesto: 80 }));
    expect(cifrasDelViaje(gastos, iguales).quienMasPuso).toBeNull();
  });

  it("con un solo día, ni día más caro ni media por día", () => {
    const unDia = gastos.slice(0, 2);
    const c = cifrasDelViaje(unDia, personas);
    expect(c.diaMasCaro).toBeNull();
    expect(c.diaMasBarato).toBeNull();
    expect(c.porPersonaYDia).toBeNull();
  });

  it("los gastos sin fecha, de antes, no cuentan como día", () => {
    const sinFecha = gastos.map((g) => ({ ...g, fecha: undefined }));
    const c = cifrasDelViaje(sinFecha, personas);
    expect(c.dias).toBe(0);
    expect(c.diaMasCaro).toBeNull();
    expect(c.total).toBe(240);
  });

  it("sin gastos, nada", () => {
    expect(cifrasDelViaje([], personas)).toBeNull();
  });
});

describe("cifrasEnTexto", () => {
  const texto = cifrasEnTexto(cifrasDelViaje(gastos, personas), "Lisboa", "EUR");

  it("lleva el nombre y el total", () => {
    expect(texto).toContain("*Lisboa* en cifras");
    expect(texto).toContain("240.00 € en 5 gastos (48.00 € de media)");
  });

  it("con un solo gasto, sin media", () => {
    const uno = cifrasEnTexto(cifrasDelViaje(gastos.slice(0, 1), personas), "Lisboa", "EUR");
    expect(uno).not.toContain("de media");
  });

  it("lleva cada cifra", () => {
    expect(texto).toContain("El que más puso: Ana, 150.00 €");
    expect(texto).toContain("El que menos puso: Marta, 30.00 €");
    expect(texto).toContain("El gasto más gordo: Hotel, 120.00 € (Ana)");
    expect(texto).toContain("El más pequeño: Taxi, 20.00 € (Luis)");
    expect(texto).toContain("alojamiento, el 50 %");
    expect(texto).toContain("26.67 € por persona y día");
    expect(texto).toContain("El día más tranquilo:");
    expect(texto).toContain("30.00 €");
  });

  it("el que más veces pagó, si lo hay", () => {
    const otroTaxi = [...gastos, { pagadorId: "b", importe: 10, concepto: "Bus", fecha: "2026-09-12" }];
    expect(cifrasEnTexto(cifrasDelViaje(otroTaxi, personas), "Lisboa", "EUR")).toContain(
      "El que más veces pagó: Luis, 3 veces",
    );
    expect(texto).not.toContain("más veces");
  });

  it("el día más movido, si lo hay", () => {
    const otroTaxi = [...gastos, { pagadorId: "b", importe: 5, concepto: "Bus", fecha: "2026-09-12" }];
    expect(cifrasEnTexto(cifrasDelViaje(otroTaxi, personas), "Lisboa", "EUR")).toContain("El día más movido:");
    expect(texto).not.toContain("más movido");
  });

  it("lo que más se repitió, si lo hay", () => {
    const taxis = [...gastos, { pagadorId: "b", importe: 15, concepto: "Taxi", fecha: "2026-09-12" }];
    expect(cifrasEnTexto(cifrasDelViaje(taxis, personas), "Lisboa", "EUR")).toContain(
      "Lo que más se repitió: Taxi, 2 veces (35.00 €)",
    );
    expect(texto).not.toContain("se repitió");
  });

  it("lo que no hay, no sale", () => {
    const unDia = cifrasEnTexto(cifrasDelViaje(gastos.slice(0, 2), personas), "Lisboa", "EUR");
    expect(unDia).not.toContain("por persona y día");
    expect(unDia).not.toContain("día más caro");
  });
});
