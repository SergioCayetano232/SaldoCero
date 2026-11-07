import { describe, it, expect, afterEach } from "vitest";
import { usarIdioma } from "./idioma";
import { nombreDeLaRepeticion, genteParaRepetir, quienEresEnElNuevo, pendientesParaPasar, gastosDeLoPendiente, preguntaDePendientes } from "./repetirViaje";
import { calcularBalances } from "./calculos";

describe("nombreDeLaRepeticion", () => {
  it("sin número, el 2", () => {
    expect(nombreDeLaRepeticion("Ibiza")).toBe("Ibiza 2");
  });

  it("con número, el siguiente", () => {
    expect(nombreDeLaRepeticion("Ibiza 2")).toBe("Ibiza 3");
    expect(nombreDeLaRepeticion("Finde 9")).toBe("Finde 10");
  });

  it("con un año, el que viene", () => {
    expect(nombreDeLaRepeticion("Ibiza 2026")).toBe("Ibiza 2027");
  });

  it("un número largo que no es año no se toca", () => {
    expect(nombreDeLaRepeticion("Ruta 66666")).toBe("Ruta 66666 2");
    expect(nombreDeLaRepeticion("Hotel 340")).toBe("Hotel 340 2");
  });

  it("si es solo un número, no lo trata como contador", () => {
    expect(nombreDeLaRepeticion("2026")).toBe("2026 2");
  });

  it("sin espacios de sobra", () => {
    expect(nombreDeLaRepeticion("  Ibiza  ")).toBe("Ibiza 2");
  });
});

describe("genteParaRepetir", () => {
  it("los nombres y dónde cobran, sin los ids", () => {
    const viajeros = [
      { id: "a", nombre: "Ana", cobro: "600111222" },
      { id: "b", nombre: "Luis" },
    ];
    expect(genteParaRepetir(viajeros)).toEqual([
      { nombre: "Ana", cobro: "600111222" },
      { nombre: "Luis", cobro: null },
    ]);
  });
});

describe("quienEresEnElNuevo", () => {
  const viejos = [{ id: "a", nombre: "Ana" }, { id: "b", nombre: "Luis" }];
  const nuevos = [{ id: "x", nombre: "Ana" }, { id: "y", nombre: "Luis" }];

  it("el mismo, por nombre", () => {
    expect(quienEresEnElNuevo("b", viejos, nuevos)).toBe("y");
  });

  it("si no eras nadie, sigues sin serlo", () => {
    expect(quienEresEnElNuevo(null, viejos, nuevos)).toBeNull();
  });

  it("si no ha pasado al nuevo, nadie", () => {
    expect(quienEresEnElNuevo("b", viejos, [{ id: "x", nombre: "Ana" }])).toBeNull();
  });
});

describe("lo pendiente al repetir", () => {
  const viejos = [
    { id: "a1", nombre: "Ana" },
    { id: "l1", nombre: "Luis" },
    { id: "m1", nombre: "Marta" },
  ];
  const nuevos = [
    { id: "a2", nombre: "Ana" },
    { id: "l2", nombre: "Luis" },
    { id: "m2", nombre: "Marta" },
  ];
  const deLuis = { de: "Luis", a: "Ana", deId: "l1", aId: "a1", cantidad: 20, saldado: false };
  const deMarta = { de: "Marta", a: "Ana", deId: "m1", aId: "a1", cantidad: 12.345, saldado: false };
  const opciones = { nombre: "Ibiza", moneda: "EUR", dia: "2026-11-06" };

  it("solo lo que no está pagado ni es del bote", () => {
    const pagado = { ...deLuis, saldado: true };
    const delBote = { de: "Bote", a: "Ana", deId: "bote", aId: "a1", cantidad: 5, saldado: false };
    const alBote = { de: "Luis", a: "Bote", deId: "l1", aId: "bote", cantidad: 5, saldado: false };
    expect(pendientesParaPasar([pagado, delBote, alBote, deMarta])).toEqual([deMarta]);
  });

  it("cada deuda, un gasto del que cobra que es solo del que debe", () => {
    const [{ pago, gasto }] = gastosDeLoPendiente([deLuis], viejos, nuevos, opciones);
    expect(pago).toBe(deLuis);
    expect(gasto).toEqual({
      pagadorId: "a2",
      importe: 20,
      moneda: "EUR",
      importeConvertido: 20,
      concepto: "Lo que quedó de Ibiza",
      categoria: "otros",
      fecha: "2026-11-06",
      nota: "Luis le debía esto a Ana",
      participantes: ["l2"],
      partes: null,
    });
  });

  it("deja el balance como estaba", () => {
    const pares = gastosDeLoPendiente([deLuis, deMarta], viejos, nuevos, opciones);
    const balances = calcularBalances(nuevos, pares.map((p, i) => ({ id: `g${i}`, ...p.gasto })));
    const de = (id) => balances.find((b) => b.id === id).balance;
    expect(de("a2")).toBeCloseTo(32.35);
    expect(de("l2")).toBeCloseTo(-20);
    expect(de("m2")).toBeCloseTo(-12.35);
  });

  it("redondea a céntimos", () => {
    const [{ gasto }] = gastosDeLoPendiente([deMarta], viejos, nuevos, opciones);
    expect(gasto.importe).toBe(12.35);
  });

  it("si uno no ha pasado al nuevo, su deuda se queda donde estaba", () => {
    const sinMarta = nuevos.filter((v) => v.nombre !== "Marta");
    expect(gastosDeLoPendiente([deLuis, deMarta], viejos, sinMarta, opciones).map((p) => p.pago)).toEqual([deLuis]);
  });

  it("la pregunta, con una o con varias", () => {
    expect(preguntaDePendientes([deLuis], "Ibiza 2", "EUR")).toBe(
      'Queda una deuda sin pagar: Luis le debe 20.00 € a Ana. ¿La pasamos a "Ibiza 2"? Allí saldrá como un gasto y aquí se dará por pagada.'
    );
    expect(preguntaDePendientes([deLuis, deMarta], "Ibiza 2", "EUR")).toMatch(/^Quedan 2 deudas sin pagar, 32\.35 € en total\./);
  });
});

describe("preguntaDePendientes en inglés", () => {
  afterEach(() => usarIdioma("es"));

  it("con una y con varias", () => {
    usarIdioma("en");
    const uno = { de: "Luis", a: "Ana", cantidad: 20 };
    expect(preguntaDePendientes([uno], "Ibiza 2", "EUR")).toMatch(/^There's one unpaid debt: Luis owes Ana 20\.00 €\. Move it to "Ibiza 2"\?/);
    expect(preguntaDePendientes([uno, { ...uno, de: "Marta" }], "Ibiza 2", "EUR")).toMatch(/^There are 2 unpaid debts, 40\.00 € in total\./);
  });
});
