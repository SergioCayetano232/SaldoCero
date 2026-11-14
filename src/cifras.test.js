import { describe, it, expect, afterEach } from "vitest";
import { usarIdioma } from "./idioma";
import { cifrasDelViaje, cifrasEnTexto, diaDeLaSemana, elMasTrasnochado, findeContraSemana, cuantasVeces, laMitadEn, horaDeApuntar, elGordoDeCadaUno, elDiaDeCadaUno, elGordoDeFuera, categoriaMasVeces } from "./cifras";
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

  describe("lo más caro por cabeza", () => {
    // El hotel, 120 entre los tres: 40. La cena de dos, 90: 45.
    const conCena = [...gastos, { pagadorId: "b", importe: 90, concepto: "Marisco", participantes: ["a", "b"], fecha: "2026-09-11" }];

    it("aunque no sea el más gordo", () => {
      expect(cifrasDelViaje(conCena, personas).masCaroPorCabeza).toEqual({ concepto: "Marisco", porCabeza: 45, cuantos: 2 });
    });

    it("si es el mismo que el más gordo, no sale", () => {
      expect(cifras.masCaroPorCabeza).toBeNull();
    });

    it("los de uno solo o a partes desiguales no cuentan", () => {
      const raros = [
        ...gastos,
        { pagadorId: "c", importe: 100, concepto: "Abrigo", participantes: ["c"], fecha: "2026-09-11" },
        { pagadorId: "b", importe: 110, concepto: "Chuletón", participantes: ["a", "b"], partes: { a: 3, b: 1 }, fecha: "2026-09-11" },
      ];
      expect(cifrasDelViaje(raros, personas).masCaroPorCabeza).toBeNull();
    });

    it("va por lo convertido", () => {
      const enDolares = [...gastos, { pagadorId: "a", importe: 100, importeConvertido: 92, concepto: "Barco", participantes: ["a", "b"], fecha: "2026-09-11" }];
      expect(cifrasDelViaje(enDolares, personas).masCaroPorCabeza.porCabeza).toBe(46);
    });
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

  it("lo que salió del bote, con su parte del total", () => {
    const conBote = gastos.map((g, i) => (i < 2 ? { ...g, pagadorId: BOTE } : g));
    // El hotel y la cena: 160 de 240.
    expect(cifrasDelViaje(conBote, personas).delBote).toEqual({ total: 160, gastos: 2, porcentaje: 67 });
  });

  it("sin bote, nada del bote", () => {
    expect(cifras.delBote).toBeNull();
  });

  it("lo del bote va por lo convertido", () => {
    const enDolares = [{ ...gastos[0], pagadorId: BOTE, importe: 130, importeConvertido: 120 }, gastos[1]];
    expect(cifrasDelViaje(enDolares, personas).delBote.total).toBe(120);
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

  it("cuántos llevan ticket", () => {
    const conFotos = gastos.map((g, i) => (i < 2 ? { ...g, ticket: `viaje/${i}.jpg` } : g));
    expect(cifrasDelViaje(conFotos, personas).tickets).toEqual({ conTicket: 2, gastos: 5 });
  });

  it("cuántos llevan nota, sin contar las que son solo espacios", () => {
    const conNotas = gastos.map((g, i) => (i < 2 ? { ...g, nota: "incluye la propina" } : i === 2 ? { ...g, nota: "   " } : g));
    expect(cifrasDelViaje(conNotas, personas).notas).toEqual({ conNota: 2, gastos: 5 });
  });

  it("cuántos se pagaron sin céntimos, con lo que se pagó de verdad", () => {
    const deFuera = [
      { pagadorId: "a", importe: 20, moneda: "USD", importeConvertido: 18.43, concepto: "Cena", categoria: "comida" },
      { pagadorId: "a", importe: 12.5, concepto: "Taxi", categoria: "transporte" },
      { pagadorId: "b", importe: 30, concepto: "Museo", categoria: "ocio" },
    ];
    expect(cifrasDelViaje(deFuera, personas).redondos).toEqual({ redondos: 2, gastos: 3 });
  });

  it("con uno solo redondo, o menos de tres gastos, nada", () => {
    const pocos = (...importes) => importes.map((importe) => ({ pagadorId: "a", importe, concepto: "Cena", categoria: "comida" }));
    expect(cifrasDelViaje(pocos(20, 12.5, 3.2), personas).redondos).toBeNull();
    expect(cifrasDelViaje(pocos(20, 30), personas).redondos).toBeNull();
  });

  it("si nadie puso nota, nada de notas", () => {
    expect(cifras.notas).toBeNull();
    expect(cifrasDelViaje(gastos.map((g) => ({ ...g, nota: "" })), personas).notas).toBeNull();
  });

  it("si nadie hizo foto, nada de tickets", () => {
    expect(cifras.tickets).toBeNull();
    expect(cifrasDelViaje(gastos.map((g) => ({ ...g, ticket: null })), personas).tickets).toBeNull();
  });

  it("en qué monedas se pagó, la del viaje primero", () => {
    const fuera = gastos.map((g, i) => ({ ...g, moneda: ["MAD", "EUR", "USD", "MAD", "EUR"][i] }));
    expect(cifrasDelViaje(fuera, personas, "EUR").monedas).toEqual(["EUR", "MAD", "USD"]);
  });

  it("con una sola moneda, nada de monedas", () => {
    expect(cifrasDelViaje(gastos.map((g) => ({ ...g, moneda: "EUR" })), personas, "EUR").monedas).toBeNull();
    // Los de antes no traen moneda: van en la del viaje.
    expect(cifrasDelViaje(gastos, personas, "EUR").monedas).toBeNull();
  });

  it("si todo se pagó fuera, la del viaje no cuenta", () => {
    const fuera = gastos.map((g, i) => ({ ...g, moneda: i < 2 ? "USD" : "MAD" }));
    expect(cifrasDelViaje(fuera, personas, "EUR").monedas).toEqual(["USD", "MAD"]);
  });

  it("cuántos no fueron de todos", () => {
    const sinMarta = gastos.map((g, i) => (i < 2 ? { ...g, participantes: ["a", "b"] } : g));
    expect(cifrasDelViaje(sinMarta, personas).deAlgunos).toEqual({ deAlgunos: 2, gastos: 5 });
  });

  it("si todo fue entre todos, nada", () => {
    expect(cifras.deAlgunos).toBeNull();
    expect(cifrasDelViaje(gastos.map((g) => ({ ...g, participantes: ["a", "b", "c"] })), personas).deAlgunos).toBeNull();
  });

  it("el que más gastó va por lo que le tocaba, no por lo que puso", () => {
    const comilones = personas.map((p, i) => ({ ...p, tocaPagar: [50, 140, 50][i] }));
    expect(cifrasDelViaje(gastos, comilones).quienMasGasto).toMatchObject({ nombre: "Luis", tocaPagar: 140 });
    expect(cifrasEnTexto(cifrasDelViaje(gastos, comilones), "Lisboa", "EUR")).toContain("El que más gastó: Luis");
  });

  it("si todos gastaron lo mismo o empatan, nadie gastó más", () => {
    expect(cifrasDelViaje(gastos, personas.map((p) => ({ ...p, tocaPagar: 80 }))).quienMasGasto).toBeNull();
    expect(cifrasDelViaje(gastos, personas.map((p, i) => ({ ...p, tocaPagar: [100, 100, 40][i] }))).quienMasGasto).toBeNull();
    expect(cifrasDelViaje(gastos, personas).quienMasGasto).toBeNull();
  });

  it("el primer y el último gasto, por su día", () => {
    const c = cifrasDelViaje(gastos, personas);
    expect(c.primerGasto.concepto).toBe("Hotel");
    expect(c.ultimoGasto).toMatchObject({ concepto: "Taxi", importe: 20 });
    expect(cifrasEnTexto(c, "Lisboa", "EUR")).toContain("Empezasteis con: Hotel");
  });

  it("el mismo día, manda cuándo se apuntó", () => {
    const desordenados = [
      { ...gastos[4], creadoEn: "2026-09-12T22:00" },
      { ...gastos[3], creadoEn: "2026-09-12T14:00" },
      gastos[0],
    ];
    expect(cifrasDelViaje(desordenados, personas).ultimoGasto.concepto).toBe("Taxi");
  });

  it("en un solo día no hay primero ni último", () => {
    expect(cifrasDelViaje(gastos.slice(0, 2), personas).primerGasto).toBeNull();
  });

  it("sin gastos, nada", () => {
    expect(cifrasDelViaje([], personas)).toBeNull();
  });
});

describe("cifrasEnTexto", () => {
  const texto = cifrasEnTexto(cifrasDelViaje(gastos, personas), "Lisboa", "EUR");

  it("lleva el nombre y el total", () => {
    expect(texto).toContain("*Lisboa* en cifras");
    expect(texto).toContain("240,00 € en 5 gastos (48,00 € de media)");
  });

  it("frente al viaje anterior, si lo hay", () => {
    const frente = { nombre: "Oporto", porDia: false, antes: 300, porcentaje: -20 };
    expect(cifrasEnTexto(cifrasDelViaje(gastos, personas), "Lisboa", "EUR", frente)).toContain("🔁 Un 20 % menos que en Oporto, donde gastasteis 300,00 €");
    expect(texto).not.toContain("🔁");
  });

  it("con un solo gasto, sin media", () => {
    const uno = cifrasEnTexto(cifrasDelViaje(gastos.slice(0, 1), personas), "Lisboa", "EUR");
    expect(uno).toContain("120,00 € en 1 gasto");
    expect(uno).not.toContain("gastos");
    expect(uno).not.toContain("de media");
  });

  it("lleva cada cifra", () => {
    expect(texto).toContain("El que más puso: Ana, 150,00 €");
    expect(texto).toContain("El que menos puso: Marta, 30,00 €");
    expect(texto).toContain("El gasto más gordo: Hotel, 120,00 € (Ana)");
    expect(texto).toContain("El más pequeño: Taxi, 20,00 € (Luis)");
    expect(texto).toContain("alojamiento, el 50 %");
    expect(texto).toContain("26,67 € por persona y día");
    expect(texto).toContain("El día más tranquilo:");
    expect(texto).toContain("30,00 €");
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
      "Lo que más se repitió: Taxi, 2 veces (35,00 €)",
    );
    expect(texto).not.toContain("se repitió");
  });

  it("lo más caro por cabeza, si lo hay", () => {
    const conCena = [...gastos, { pagadorId: "b", importe: 90, concepto: "Marisco", participantes: ["a", "b"], fecha: "2026-09-11" }];
    expect(cifrasEnTexto(cifrasDelViaje(conCena, personas), "Lisboa", "EUR")).toContain(
      "Lo más caro por cabeza: Marisco, 45,00 € cada uno (entre 2)",
    );
    expect(texto).not.toContain("por cabeza");
  });

  it("lo del bote, si lo hubo, y en singular si fue uno", () => {
    const uno = gastos.map((g, i) => (i === 0 ? { ...g, pagadorId: BOTE } : g));
    expect(cifrasEnTexto(cifrasDelViaje(uno, personas), "Lisboa", "EUR")).toContain(
      "Del bote salieron 120,00 € en 1 gasto, el 50 %",
    );
    expect(texto).not.toContain("bote");
  });

  it("los tickets, y en singular si solo hubo un gasto", () => {
    const conFoto = gastos.map((g, i) => (i === 0 ? { ...g, ticket: "viaje/0.jpg" } : g));
    expect(cifrasEnTexto(cifrasDelViaje(conFoto, personas), "Lisboa", "EUR")).toContain("1 de 5 gastos con ticket");
    expect(cifrasEnTexto(cifrasDelViaje(conFoto.slice(0, 1), personas), "Lisboa", "EUR")).toContain(
      "1 de 1 gasto con ticket",
    );
    expect(cifrasEnTexto(cifrasDelViaje(gastos, personas), "Lisboa", "EUR")).not.toContain("ticket");
  });

  it("las notas, y en singular si solo hubo un gasto", () => {
    const conNota = gastos.map((g, i) => (i === 0 ? { ...g, nota: "incluye la propina" } : g));
    expect(cifrasEnTexto(cifrasDelViaje(conNota, personas), "Lisboa", "EUR")).toContain("1 de 5 gastos con nota");
    expect(cifrasEnTexto(cifrasDelViaje(conNota.slice(0, 1), personas), "Lisboa", "EUR")).toContain(
      "1 de 1 gasto con nota",
    );
    expect(cifrasEnTexto(cifrasDelViaje(gastos, personas), "Lisboa", "EUR")).not.toContain("con nota");
  });

  it("los redondos, y si lo son todos lo dice", () => {
    const pocos = (...importes) => importes.map((importe) => ({ pagadorId: "a", importe, concepto: "Cena", categoria: "comida" }));
    expect(cifrasEnTexto(cifrasDelViaje(pocos(20, 30, 4.5), personas), "Lisboa", "EUR")).toContain("💯 2 de 3 gastos, sin céntimos");
    expect(cifrasEnTexto(cifrasDelViaje(pocos(20, 30, 5), personas), "Lisboa", "EUR")).toContain("💯 Todos los gastos, sin céntimos");
  });

  it("las monedas, si hubo más de una", () => {
    const fuera = gastos.map((g, i) => (i === 0 ? { ...g, moneda: "MAD" } : g));
    expect(cifrasEnTexto(cifrasDelViaje(fuera, personas, "EUR"), "Lisboa", "EUR")).toContain(
      "Pagasteis en 2 monedas: EUR y MAD",
    );
    expect(cifrasEnTexto(cifrasDelViaje(gastos, personas, "EUR"), "Lisboa", "EUR")).not.toContain("monedas");
  });

  it("los que no fueron de todos, con el verbo bien", () => {
    const uno = gastos.map((g, i) => (i === 0 ? { ...g, participantes: ["a"] } : g));
    const dos = gastos.map((g, i) => (i < 2 ? { ...g, participantes: ["a"] } : g));
    expect(cifrasEnTexto(cifrasDelViaje(uno, personas), "Lisboa", "EUR")).toContain("1 de 5 gastos no fue de todos");
    expect(cifrasEnTexto(cifrasDelViaje(dos, personas), "Lisboa", "EUR")).toContain("2 de 5 gastos no fueron de todos");
    expect(cifrasEnTexto(cifrasDelViaje(gastos, personas), "Lisboa", "EUR")).not.toContain("de todos");
  });

  it("lo que no hay, no sale", () => {
    const unDia = cifrasEnTexto(cifrasDelViaje(gastos.slice(0, 2), personas), "Lisboa", "EUR");
    expect(unDia).not.toContain("por persona y día");
    expect(unDia).not.toContain("día más caro");
  });
});

describe("diaDeLaSemana", () => {
  // El 31 de octubre de 2026 es sábado, y el 7 de noviembre también.
  const dia = (fecha, total) => ({ fecha, total });

  it("el que más se gasta de media, si se ha repetido", () => {
    const dias = [dia("2026-10-30", 50), dia("2026-10-31", 120), dia("2026-11-06", 60), dia("2026-11-07", 160)];
    expect(diaDeLaSemana(dias)).toEqual({ dia: "sábados", media: 140, veces: 2 });
  });

  it("en un finde cada día sale una vez: eso ya es el día más caro", () => {
    expect(diaDeLaSemana([dia("2026-10-30", 50), dia("2026-10-31", 120), dia("2026-11-01", 30)])).toBeNull();
  });

  it("si el que gana solo salió una vez, tampoco", () => {
    const dias = [dia("2026-10-30", 50), dia("2026-11-06", 60), dia("2026-10-31", 300)];
    expect(diaDeLaSemana(dias)).toBeNull();
  });

  it("con empate no hay uno que contar", () => {
    const dias = [dia("2026-10-30", 100), dia("2026-11-06", 100), dia("2026-10-31", 50), dia("2026-11-07", 150)];
    expect(diaDeLaSemana(dias)).toBeNull();
  });

  it("si todo cae en el mismo día de la semana, no hay con qué comparar", () => {
    expect(diaDeLaSemana([dia("2026-10-31", 50), dia("2026-11-07", 80)])).toBeNull();
  });

  it("los días que no cambian de nombre en plural", () => {
    const dias = [dia("2026-10-28", 90), dia("2026-11-04", 90), dia("2026-10-29", 10)];
    expect(diaDeLaSemana(dias).dia).toBe("miércoles");
  });

  it("sale en las cifras del viaje y en el texto", () => {
    const largo = [
      { pagadorId: "a", importe: 50, concepto: "Cena", categoria: "comida", fecha: "2026-10-30" },
      { pagadorId: "a", importe: 120, concepto: "Cena", categoria: "comida", fecha: "2026-10-31" },
      { pagadorId: "b", importe: 60, concepto: "Cena", categoria: "comida", fecha: "2026-11-06" },
      { pagadorId: "b", importe: 160, concepto: "Cena", categoria: "comida", fecha: "2026-11-07" },
    ];
    const cifras = cifrasDelViaje(largo, personas);
    expect(cifras.diaDeLaSemana.dia).toBe("sábados");
    expect(cifrasEnTexto(cifras, "Lisboa", "EUR")).toContain("🗓️ Cuando más gastáis: los sábados, 140,00 € de media");
  });

  it("en el viaje corto de siempre, no", () => {
    expect(cifrasDelViaje(gastos, personas).diaDeLaSemana).toBeNull();
  });
});

describe("findeContraSemana", () => {
  // El 30 de octubre de 2026 es viernes; el 31 sábado y el 1 de noviembre domingo.
  const dia = (fecha, total) => ({ fecha, total });

  it("los findes, si se gasta bastante más", () => {
    const dias = [dia("2026-10-29", 40), dia("2026-10-30", 80), dia("2026-10-31", 150), dia("2026-11-01", 90)];
    expect(findeContraSemana(dias)).toEqual({ gana: "finde", finde: 120, semana: 60, veces: 2 });
  });

  it("o entre semana, que también pasa", () => {
    const dias = [dia("2026-10-30", 90), dia("2026-10-31", 50)];
    expect(findeContraSemana(dias)).toEqual({ gana: "semana", finde: 50, semana: 90, veces: 1.8 });
  });

  it("por debajo de vez y media no cuenta", () => {
    expect(findeContraSemana([dia("2026-10-30", 100), dia("2026-10-31", 140)])).toBeNull();
  });

  it("sin días de los dos lados no hay con qué comparar", () => {
    expect(findeContraSemana([dia("2026-10-31", 100), dia("2026-11-01", 20)])).toBeNull();
    expect(findeContraSemana([dia("2026-10-29", 100), dia("2026-10-30", 20)])).toBeNull();
    expect(findeContraSemana([])).toBeNull();
  });

  it("un lado a cero no es infinitas veces más", () => {
    expect(findeContraSemana([dia("2026-10-30", 0), dia("2026-10-31", 50)])).toBeNull();
  });

  it("en palabras", () => {
    expect(cuantasVeces(2)).toBe("el doble");
    expect(cuantasVeces(3)).toBe("el triple");
    expect(cuantasVeces(1.8)).toBe("1,8 veces más");
  });

  it("sale en las cifras del viaje y en el texto", () => {
    const largo = [
      { pagadorId: "a", importe: 60, concepto: "Cena", categoria: "comida", fecha: "2026-10-30" },
      { pagadorId: "b", importe: 120, concepto: "Cena", categoria: "comida", fecha: "2026-10-31" },
    ];
    const cifras = cifrasDelViaje(largo, personas);
    expect(cifras.findeContraSemana.gana).toBe("finde");
    expect(cifrasEnTexto(cifras, "Lisboa", "EUR")).toContain(
      "🎉 Los findes gastáis el doble que entre semana: 120,00 € al día contra 60,00 €",
    );
  });

  it("y al revés en el texto", () => {
    const largo = [
      { pagadorId: "a", importe: 150, concepto: "Cena", categoria: "comida", fecha: "2026-10-30" },
      { pagadorId: "b", importe: 50, concepto: "Cena", categoria: "comida", fecha: "2026-10-31" },
    ];
    expect(cifrasEnTexto(cifrasDelViaje(largo, personas), "Lisboa", "EUR")).toContain(
      "🎉 Entre semana gastáis el triple que los findes: 150,00 € al día contra 50,00 €",
    );
  });
});

describe("laMitadEn", () => {
  const de = (...importes) => importes.map((importe) => ({ pagadorId: "a", importe, concepto: "Cena", categoria: "comida" }));

  it("los pocos gastos que se llevaron la mitad", () => {
    // 200 en total: 60 + 40 ya son 100.
    expect(laMitadEn(de(60, 40, 20, 20, 20, 20, 10, 10))).toEqual({ gastos: 2, de: 8 });
  });

  it("si justo llega a la mitad, ya cuenta", () => {
    expect(laMitadEn(de(30, 30, 10, 10, 10, 10))).toEqual({ gastos: 2, de: 6 });
  });

  it("con uno solo ya está el gasto más gordo", () => {
    expect(laMitadEn(de(100, 10, 10, 10, 10, 10))).toBeNull();
  });

  it("si hace falta más de un tercio de los gastos, no", () => {
    expect(laMitadEn(de(20, 20, 20, 20, 20, 20))).toBeNull();
  });

  it("sin dinero no hay mitad", () => {
    expect(laMitadEn([])).toBeNull();
    expect(laMitadEn(de(0, 0, 0))).toBeNull();
  });

  it("sale en las cifras del viaje y en el texto", () => {
    const cifras = cifrasDelViaje(de(60, 40, 20, 20, 20, 20, 10, 10), personas);
    expect(cifras.laMitadEn).toEqual({ gastos: 2, de: 8 });
    expect(cifrasEnTexto(cifras, "Lisboa", "EUR")).toContain("⚖️ La mitad del dinero se fue en 2 de 8 gastos");
  });
});

describe("elMasTrasnochado", () => {
  const a = (concepto, hora, pagadorId = "a") => ({ concepto, pagadorId, importe: 10, creadoEn: `2026-09-12T${hora}:00` });

  it("las 3 de la mañana van después de las 23", () => {
    const gastos = [a("Cena", "21:30"), a("Copas", "23:50", "b"), a("Kebab", "03:12"), a("Taxi", "01:05")];
    expect(elMasTrasnochado(gastos, personas)).toEqual({ concepto: "Kebab", importe: 10, quien: "Ana", hora: "3:12" });
  });

  it("si nadie apuntó nada de noche, nada", () => {
    expect(elMasTrasnochado([a("Desayuno", "06:00"), a("Cena", "22:59")], personas)).toBeNull();
  });

  it("los de antes no guardaban la hora", () => {
    expect(elMasTrasnochado([{ concepto: "Cena", pagadorId: "a", importe: 10 }], personas)).toBeNull();
  });

  it("sale en las cifras del viaje y en el texto", () => {
    const cifras = cifrasDelViaje([a("Cena", "21:30"), a("Kebab", "02:07", "b")], personas);
    expect(cifras.trasnochado.concepto).toBe("Kebab");
    expect(cifrasEnTexto(cifras, "Lisboa", "EUR")).toContain("🦉 Lo más trasnochado: Kebab, apuntado a las 2:07 (Luis)");
  });
});

describe("horaDeApuntar", () => {
  const a = (hora) => ({ creadoEn: `2026-09-12T${hora}:00` });

  it("la franja en la que más se apunta", () => {
    expect(horaDeApuntar([a("22:10"), a("23:40"), a("02:15"), a("13:00")])).toEqual({
      franja: "por la noche",
      emoji: "🌙",
      veces: 3,
      de: 4,
    });
  });

  it("con empate, o con menos de tres con hora, nada", () => {
    expect(horaDeApuntar([a("09:00"), a("16:00"), a("22:00")])).toBeNull();
    expect(horaDeApuntar([a("09:00"), a("10:00"), {}, {}])).toBeNull();
  });

  it("sale en el texto", () => {
    const conHora = gastos.map((g) => ({ ...g, creadoEn: "2026-09-12T10:00:00" }));
    expect(cifrasEnTexto(cifrasDelViaje(conHora, personas), "Lisboa", "EUR")).toContain("Apuntáis más por la mañana: 5 de 5 gastos");
  });
});

describe("elGordoDeCadaUno", () => {
  it("lo más caro que pagó cada uno, del más gordo al menos", () => {
    expect(elGordoDeCadaUno(gastos, personas)).toEqual([
      { nombre: "Ana", concepto: "Hotel", importe: 120 },
      { nombre: "Luis", concepto: "Cena", importe: 40 },
      { nombre: "Marta", concepto: "Comida", importe: 30 },
    ]);
  });

  it("el que no pagó nada no sale, y lo del bote tampoco", () => {
    const sinMarta = [...gastos.filter((g) => g.pagadorId !== "c"), { ...gastos[0], pagadorId: BOTE, importe: 500 }];
    expect(elGordoDeCadaUno(sinMarta, personas).map((c) => c.nombre)).toEqual(["Ana", "Luis"]);
  });

  it("si solo pagó uno, nada", () => {
    expect(elGordoDeCadaUno(gastos.filter((g) => g.pagadorId === "a"), personas)).toBeNull();
  });

  it("sale en el texto", () => {
    expect(cifrasEnTexto(cifrasDelViaje(gastos, personas), "Lisboa", "EUR")).toContain("Lo más gordo de cada uno: Ana, Hotel");
  });
});

describe("elDiaDeCadaUno", () => {
  it("el día que más pagó cada uno, del más caro al menos", () => {
    expect(elDiaDeCadaUno(gastos, personas)).toEqual([
      { nombre: "Ana", fecha: "2026-09-10", total: 120 },
      { nombre: "Luis", fecha: "2026-09-10", total: 40 },
      { nombre: "Marta", fecha: "2026-09-12", total: 30 },
    ]);
  });

  it("suma todo lo del día, no solo el más gordo", () => {
    const canas = [
      { pagadorId: "a", importe: 50, concepto: "Cena", fecha: "2026-09-10" },
      { pagadorId: "a", importe: 30, concepto: "Cañas", fecha: "2026-09-11" },
      { pagadorId: "a", importe: 30, concepto: "Cañas", fecha: "2026-09-11" },
      { pagadorId: "b", importe: 20, concepto: "Taxi", fecha: "2026-09-11" },
    ];
    expect(elDiaDeCadaUno(canas, personas)[0]).toEqual({ nombre: "Ana", fecha: "2026-09-11", total: 60 });
  });

  it("con empate, el primer día", () => {
    const iguales = [
      { pagadorId: "a", importe: 40, concepto: "Cena", fecha: "2026-09-10" },
      { pagadorId: "a", importe: 40, concepto: "Cena", fecha: "2026-09-11" },
      { pagadorId: "b", importe: 20, concepto: "Taxi", fecha: "2026-09-11" },
    ];
    expect(elDiaDeCadaUno(iguales, personas)[0].fecha).toBe("2026-09-10");
  });

  it("el del bote y los gastos sin día no cuentan", () => {
    const conBote = [...gastos, { pagadorId: BOTE, importe: 500, concepto: "Hotel", fecha: "2026-09-11" }, { pagadorId: "c", importe: 900, concepto: "Viejo" }];
    expect(elDiaDeCadaUno(conBote, personas).map((c) => c.total)).toEqual([120, 40, 30]);
  });

  it("con un solo día, o si solo pagó uno, nada", () => {
    expect(elDiaDeCadaUno(gastos.map((g) => ({ ...g, fecha: "2026-09-10" })), personas)).toBeNull();
    expect(elDiaDeCadaUno(gastos.filter((g) => g.pagadorId === "a"), personas)).toBeNull();
  });

  it("sale en el texto", () => {
    expect(cifrasEnTexto(cifrasDelViaje(gastos, personas), "Lisboa", "EUR")).toContain("📆 El día más caro de cada uno: Ana: ");
  });
});

describe("elGordoDeFuera", () => {
  const deFuera = [
    { pagadorId: "a", importe: 300, concepto: "Hotel", fecha: "2026-09-10" },
    { pagadorId: "b", importe: 50, moneda: "USD", importeConvertido: 46.1, concepto: "Cena", fecha: "2026-09-10" },
    { pagadorId: "a", importe: 400, moneda: "MAD", importeConvertido: 37.2, concepto: "Zoco", fecha: "2026-09-11" },
    { pagadorId: "c", importe: 20, moneda: "EUR", concepto: "Taxi", fecha: "2026-09-11" },
  ];

  it("lo más caro en otra moneda, por lo que salió en la del viaje", () => {
    // 400 dírhams son más que 50 dólares escritos, pero salen por menos.
    expect(elGordoDeFuera(deFuera, personas, "EUR", deFuera[0])).toEqual({
      concepto: "Cena",
      importe: 46.1,
      quien: "Luis",
      pagado: 50,
      moneda: "USD",
    });
  });

  it("si es el más gordo del viaje, ya sale arriba", () => {
    expect(elGordoDeFuera(deFuera.slice(1), personas, "EUR", deFuera[1])).toBeNull();
  });

  it("todo en la del viaje, o los de antes sin moneda, nada", () => {
    expect(elGordoDeFuera(gastos, personas, "EUR", gastos[0])).toBeNull();
    expect(elGordoDeFuera(deFuera.filter((g) => g.moneda !== "USD" && g.moneda !== "MAD"), personas, "EUR", null)).toBeNull();
  });

  it("sale en el texto", () => {
    expect(cifrasEnTexto(cifrasDelViaje(deFuera, personas, "EUR"), "Lisboa", "EUR")).toContain(
      "💵 Lo más caro en otra moneda: Cena, ",
    );
  });
});

describe("categoriaMasVeces", () => {
  it("la que más veces salió, si no es donde más dinero se fue", () => {
    const c = cifrasDelViaje(gastos, personas);
    expect(c.categoria.id).toBe("alojamiento");
    expect(c.categoriaMasVeces).toMatchObject({ id: "comida", veces: 2 });
    expect(cifrasEnTexto(c, "Lisboa", "EUR")).toContain("La categoría estrella: comida, en 2 gastos");
  });

  it("si coincide con donde más dinero, ya está dicho", () => {
    expect(categoriaMasVeces(gastos, { id: "comida" })).toBeNull();
  });

  it("con empate, o con una vez cada una, nada", () => {
    expect(categoriaMasVeces(gastos.slice(0, 2), null)).toBeNull();
    const empate = [...gastos, { ...gastos[4], concepto: "Bus" }];
    expect(categoriaMasVeces(empate, null)).toBeNull();
  });
});

describe("en inglés", () => {
  afterEach(() => usarIdioma("es"));

  it("el texto para el grupo", () => {
    usarIdioma("en");
    const texto = cifrasEnTexto(cifrasDelViaje(gastos, personas), "Lisboa", "EUR");
    expect(texto).toContain("*Lisboa* in numbers");
    expect(texto).toContain("240.00 € on 5 expenses (48.00 € on average)");
    expect(texto).toContain("Biggest expense: Hotel, 120.00 € (Ana)");
    expect(texto).not.toMatch(/gasto|de media/);
  });

  it("cuántas veces, con el punto", () => {
    usarIdioma("en");
    expect(cuantasVeces(2)).toBe("twice as much");
    expect(cuantasVeces(1.8)).toBe("1.8 times as much");
  });

  it("el día de la semana y lo del bote", () => {
    usarIdioma("en");
    const dia = (fecha, total) => ({ fecha, total });
    const dias = [dia("2026-10-30", 50), dia("2026-10-31", 120), dia("2026-11-06", 60), dia("2026-11-07", 160)];
    expect(diaDeLaSemana(dias).dia).toBe("Saturdays");
    const delBote = [{ pagadorId: BOTE, importe: 50, concepto: "Super", categoria: "comida", fecha: "2026-09-10" }];
    expect(cifrasDelViaje(delBote, personas).gastoMasGrande.quien).toBe("the kitty");
  });
});
