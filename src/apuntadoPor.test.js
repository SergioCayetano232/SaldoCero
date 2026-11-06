import { describe, it, expect } from "vitest";
import { apuntadoPor } from "./apuntadoPor";

const viajeros = [
  { id: "a", nombre: "Ana" },
  { id: "l", nombre: "Luis" },
];
const cena = { id: "g", pagadorId: "a", importe: 40 };

describe("apuntadoPor", () => {
  it("si lo apuntó otro, quién", () => {
    expect(apuntadoPor({ ...cena, creadoPor: "l" }, viajeros)).toBe("apuntado por Luis");
  });

  it("si fuiste tú, tú", () => {
    expect(apuntadoPor({ ...cena, creadoPor: "l" }, viajeros, "l")).toBe("apuntado por ti");
  });

  it("si lo apuntó el que pagó, nada, que ya sale su nombre", () => {
    expect(apuntadoPor({ ...cena, creadoPor: "a" }, viajeros)).toBeNull();
  });

  it("pagado entre varios, aunque lo apuntara uno de ellos, sí", () => {
    const entreDos = { ...cena, pagadores: { a: 20, l: 20 }, creadoPor: "a" };
    expect(apuntadoPor(entreDos, viajeros)).toBe("apuntado por Ana");
  });

  it("del bote, quién lo apuntó", () => {
    expect(apuntadoPor({ ...cena, pagadorId: "bote", creadoPor: "a" }, viajeros)).toBe("apuntado por Ana");
  });

  it("los de antes no lo traen, y si se fue del viaje tampoco se sabe", () => {
    expect(apuntadoPor(cena, viajeros)).toBeNull();
    expect(apuntadoPor({ ...cena, creadoPor: null }, viajeros)).toBeNull();
    expect(apuntadoPor({ ...cena, creadoPor: "x" }, viajeros)).toBeNull();
  });
});
