import { describe, it, expect } from "vitest";
import { entenderDictado, reconocedorDeVoz } from "./dictado";

const viajeros = [
  { id: "ana", nombre: "Ana" },
  { id: "luis", nombre: "Luis" },
  { id: "jm", nombre: "José María" },
  { id: "eva", nombre: "Eva" },
];

const entender = (texto, soy = null) => entenderDictado(texto, viajeros, soy);

describe("entenderDictado", () => {
  it("concepto, importe y quién pagó", () => {
    expect(entender("cena 45 euros pagó Ana")).toEqual({
      importe: "45",
      concepto: "cena",
      pagadorId: "ana",
      participantes: null,
    });
  });

  it("con el símbolo pegado y decimales", () => {
    expect(entender("Taxi al aeropuerto 23,50 € pagó Luis")).toMatchObject({
      importe: "23,5",
      concepto: "Taxi al aeropuerto",
      pagadorId: "luis",
    });
  });

  it("los céntimos dichos con 'con'", () => {
    expect(entender("12 con 50 de gasolina").importe).toBe("12,5");
    expect(entender("12 euros con 5 céntimos de pan").importe).toBe("12,05");
    expect(entender("12 euros con 5 céntimos de pan").concepto).toBe("pan");
  });

  it("si pagaste tú, el que eres", () => {
    expect(entender("pagué yo 20 de gasolina", "eva")).toMatchObject({ pagadorId: "eva", concepto: "gasolina" });
    expect(entender("he pagado yo el hotel 300", "eva").pagadorId).toBe("eva");
    expect(entender("yo pagué los cafés 6 euros", "eva")).toMatchObject({ pagadorId: "eva", concepto: "cafés" });
  });

  it("si no sabe quién eres, el pagador se queda sin poner", () => {
    expect(entender("pagué 20 de gasolina").pagadorId).toBeNull();
  });

  it("el nombre antes del pago", () => {
    expect(entender("Ana pagó la compra 54,20")).toMatchObject({ pagadorId: "ana", concepto: "compra" });
    expect(entender("Luis lo ha pagado, museo 30")).toMatchObject({ pagadorId: "luis", concepto: "museo" });
  });

  it("sin tildes ni mayúsculas, y con nombres de dos palabras", () => {
    expect(entender("pago jose maria 10 de helados").pagadorId).toBe("jm");
    expect(entender("pagó José 10 de helados").pagadorId).toBe("jm");
  });

  it("entre quiénes", () => {
    expect(entender("museo 30 entre Ana y Luis")).toMatchObject({
      participantes: ["ana", "luis"],
      concepto: "museo",
    });
    expect(entender("cena 90 entre Ana, Luis y Eva pagó Ana").participantes).toEqual(["ana", "luis", "eva"]);
    expect(entender("cena 90 entre todos").participantes).toEqual(["ana", "luis", "jm", "eva"]);
  });

  it("los números en letra solo con euros detrás", () => {
    expect(entender("cinco euros de pan").importe).toBe("5");
    expect(entender("dos cafés 3 euros")).toMatchObject({ importe: "3", concepto: "dos cafés" });
  });

  it("con varias cifras, la que lleva euros", () => {
    expect(entender("2 bocadillos 9 euros")).toMatchObject({ importe: "9", concepto: "2 bocadillos" });
  });

  it("lo que no entiende, a null", () => {
    expect(entender("algo raro")).toEqual({ importe: null, concepto: "algo raro", pagadorId: null, participantes: null });
    expect(entender("")).toEqual({ importe: null, concepto: "", pagadorId: null, participantes: null });
  });

  it("un nombre que no es de nadie del viaje se queda en el concepto", () => {
    expect(entender("regalo para Pepe 20 pagó Ana")).toMatchObject({ concepto: "regalo para Pepe", pagadorId: "ana" });
  });
});

describe("reconocedorDeVoz", () => {
  it("el normal o el de Chrome y Safari", () => {
    const R = function () {};
    expect(reconocedorDeVoz({ SpeechRecognition: R })).toBe(R);
    expect(reconocedorDeVoz({ webkitSpeechRecognition: R })).toBe(R);
    expect(reconocedorDeVoz({})).toBeNull();
  });
});
