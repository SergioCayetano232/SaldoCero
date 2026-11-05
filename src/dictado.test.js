import { describe, it, expect } from "vitest";
import { entenderDictado, reconocedorDeVoz } from "./dictado";
import { hoy, ayer, anteayer } from "./fechas";

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
      fecha: null,
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

  it("menos alguno", () => {
    expect(entender("cena 45 pagó Ana menos Luis")).toMatchObject({
      participantes: ["ana", "jm", "eva"],
      concepto: "cena",
      pagadorId: "ana",
    });
    expect(entender("vino 20 sin Ana ni Eva").participantes).toEqual(["luis", "jm"]);
    expect(entender("taxi 30 excepto a José María y Luis").participantes).toEqual(["ana", "eva"]);
    expect(entender("cena 90 entre Ana, Luis y Eva menos Eva").participantes).toEqual(["ana", "luis"]);
  });

  it("menos yo, si sabe quién eres", () => {
    expect(entender("copas 40 para todos menos yo", "eva")).toMatchObject({ participantes: ["ana", "luis", "jm"], concepto: "copas" });
    expect(entender("copas 40 sin mí", "eva")).toMatchObject({ participantes: ["ana", "luis", "jm"], concepto: "copas" });
    expect(entender("copas 40 menos yo").participantes).toBeNull();
  });

  it("el sin de un concepto se queda en el concepto", () => {
    expect(entender("agua sin gas 2 euros")).toMatchObject({ concepto: "agua sin gas", participantes: null });
    expect(entender("gasolina 50 sin mi tarjeta", "eva")).toMatchObject({ concepto: "gasolina sin mi tarjeta", participantes: null });
  });

  it("si no queda nadie, el reparto no se toca", () => {
    expect(entender("museo 30 entre Ana y Luis menos Ana y Luis").participantes).toEqual(["ana", "luis"]);
  });

  it("los números en letra solo con euros detrás", () => {
    expect(entender("cinco euros de pan").importe).toBe("5");
    expect(entender("dos cafés 3 euros")).toMatchObject({ importe: "3", concepto: "dos cafés" });
  });

  it("con varias cifras, la que lleva euros", () => {
    expect(entender("2 bocadillos 9 euros")).toMatchObject({ importe: "9", concepto: "2 bocadillos" });
  });

  it("lo que no entiende, a null", () => {
    expect(entender("algo raro")).toEqual({ importe: null, concepto: "algo raro", pagadorId: null, participantes: null, fecha: null });
    expect(entender("")).toEqual({ importe: null, concepto: "", pagadorId: null, participantes: null, fecha: null });
  });

  it("un nombre que no es de nadie del viaje se queda en el concepto", () => {
    expect(entender("regalo para Pepe 20 pagó Ana")).toMatchObject({ concepto: "regalo para Pepe", pagadorId: "ana" });
  });
});

describe("el día dicho", () => {
  it("ayer, y no se queda en el concepto", () => {
    expect(entender("cena de ayer 45 euros pagó Ana")).toMatchObject({ concepto: "cena", fecha: ayer(), importe: "45" });
    expect(entender("ayer gasolina 60")).toMatchObject({ concepto: "gasolina", fecha: ayer() });
  });

  it("anoche también es ayer", () => {
    expect(entender("cena anoche 80 pagué yo", "luis")).toMatchObject({ concepto: "cena", fecha: ayer(), pagadorId: "luis" });
  });

  it("anteayer, junto o como antes de ayer", () => {
    expect(entender("museo anteayer 30")).toMatchObject({ concepto: "museo", fecha: anteayer() });
    expect(entender("museo antes de ayer 30")).toMatchObject({ concepto: "museo", fecha: anteayer() });
  });

  it("hoy, con tilde o sin ella da igual", () => {
    expect(entender("Hoy, desayuno 12")).toMatchObject({ concepto: "desayuno", fecha: hoy() });
  });

  it("sin decir día, se deja el que hubiera", () => {
    expect(entender("cena 45 pagó Ana").fecha).toBeNull();
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
