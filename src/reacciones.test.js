import { describe, it, expect, afterEach } from "vitest";
import { REACCIONES, reaccionesPorGasto, alTocar, trasTocar, pastillas } from "./reacciones";
import { usarIdioma } from "./idioma";

const viajeros = [
  { id: "a", nombre: "Ana" },
  { id: "b", nombre: "Luis" },
  { id: "c", nombre: "Marta" },
];

describe("reaccionesPorGasto", () => {
  it("agrupa las filas por gasto", () => {
    const porGasto = reaccionesPorGasto([
      { gasto_id: "g1", viajero_id: "a", emoji: "👍" },
      { gasto_id: "g2", viajero_id: "a", emoji: "😂" },
      { gasto_id: "g1", viajero_id: "b", emoji: "😱" },
    ]);
    expect(porGasto.get("g1")).toEqual([
      { viajeroId: "a", emoji: "👍" },
      { viajeroId: "b", emoji: "😱" },
    ]);
    expect(porGasto.get("g2")).toEqual([{ viajeroId: "a", emoji: "😂" }]);
  });

  it("las que no son de las nuestras se tiran", () => {
    expect(reaccionesPorGasto([{ gasto_id: "g1", viajero_id: "a", emoji: "🍕" }]).has("g1")).toBe(false);
  });

  it("sin filas, vacío", () => {
    expect(reaccionesPorGasto().size).toBe(0);
    expect(reaccionesPorGasto([]).size).toBe(0);
  });
});

describe("alTocar", () => {
  const puestas = [{ viajeroId: "a", emoji: "👍" }];

  it("sin la tuya, se pone", () => {
    expect(alTocar(puestas, "b", "👍")).toBe("poner");
    expect(alTocar(undefined, "b", "👍")).toBe("poner");
  });

  it("la misma que tenías, se quita", () => {
    expect(alTocar(puestas, "a", "👍")).toBe("quitar");
  });

  it("otra, se cambia", () => {
    expect(alTocar(puestas, "a", "😂")).toBe("cambiar");
  });
});

describe("trasTocar", () => {
  const puestas = [
    { viajeroId: "a", emoji: "👍" },
    { viajeroId: "b", emoji: "😂" },
  ];

  it("pone la tuya", () => {
    expect(trasTocar(puestas, "c", "🤔")).toEqual([...puestas, { viajeroId: "c", emoji: "🤔" }]);
  });

  it("cambia la tuya sin tocar las de los demás", () => {
    expect(trasTocar(puestas, "a", "😱")).toEqual([
      { viajeroId: "b", emoji: "😂" },
      { viajeroId: "a", emoji: "😱" },
    ]);
  });

  it("quita la tuya", () => {
    expect(trasTocar(puestas, "a", "👍")).toEqual([{ viajeroId: "b", emoji: "😂" }]);
  });
});

describe("pastillas", () => {
  afterEach(() => usarIdioma("es"));

  it("cuántas de cada una y quiénes", () => {
    const r = [
      { viajeroId: "a", emoji: "👍" },
      { viajeroId: "b", emoji: "👍" },
      { viajeroId: "c", emoji: "😂" },
    ];
    expect(pastillas(r, viajeros, "c")).toEqual([
      { emoji: "👍", cuantos: 2, quienes: "Ana y Luis", mia: false },
      { emoji: "😂", cuantos: 1, quienes: "Marta", mia: true },
    ]);
  });

  it("en el orden de siempre, no en el que llegaron", () => {
    const r = [
      { viajeroId: "a", emoji: "🤔" },
      { viajeroId: "b", emoji: "👍" },
    ];
    expect(pastillas(r, viajeros).map((p) => p.emoji)).toEqual(["👍", "🤔"]);
  });

  it("si el viajero ya no está, cuenta pero sin nombre", () => {
    expect(pastillas([{ viajeroId: "x", emoji: "😱" }, { viajeroId: "a", emoji: "😱" }], viajeros)).toEqual([
      { emoji: "😱", cuantos: 2, quienes: "Ana", mia: false },
    ]);
  });

  it("sin saber quién eres, ninguna es tuya", () => {
    expect(pastillas([{ viajeroId: "a", emoji: "👍" }], viajeros, null)[0].mia).toBe(false);
  });

  it("sin reacciones, ninguna pastilla", () => {
    expect(pastillas([], viajeros)).toEqual([]);
    expect(pastillas(undefined, viajeros)).toEqual([]);
  });

  it("en inglés, con and", () => {
    usarIdioma("en");
    expect(pastillas([{ viajeroId: "a", emoji: "👍" }, { viajeroId: "b", emoji: "👍" }], viajeros)[0].quienes).toBe("Ana and Luis");
  });
});

it("son cuatro, las mismas que deja la base de datos", () => {
  expect(REACCIONES).toEqual(["👍", "😂", "😱", "🤔"]);
});
