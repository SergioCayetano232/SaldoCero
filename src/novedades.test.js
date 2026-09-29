import { describe, it, expect } from "vitest";
import { novedades, textoDeNovedades } from "./novedades";

const ana = { id: "a", nombre: "Ana" };
const luis = { id: "b", nombre: "Luis" };
const cena = { id: "g1", pagadorId: "b", importe: 30, importeConvertido: 30, concepto: "Cena" };
const taxi = { id: "g2", pagadorId: "a", importe: 12, importeConvertido: 12, concepto: "Taxi" };

function viaje(gastos, viajeros = [ana, luis], id = "v1") {
  return { id, gastos, viajeros };
}

describe("novedades", () => {
  it("encuentra el gasto que no estaba", () => {
    const n = novedades(viaje([taxi]), viaje([taxi, cena]));
    expect(n.gastos.map((g) => g.id)).toEqual(["g1"]);
  });

  it("y el viajero nuevo", () => {
    const pepe = { id: "c", nombre: "Pepe" };
    const n = novedades(viaje([]), viaje([], [ana, luis, pepe]));
    expect(n.viajeros).toEqual([pepe]);
  });

  it("si no ha cambiado nada, nada", () => {
    const n = novedades(viaje([taxi]), viaje([taxi]));
    expect(n).toEqual({ gastos: [], viajeros: [] });
  });

  it("lo que has puesto tú no cuenta", () => {
    const n = novedades(viaje([]), viaje([cena]), new Set(["g1"]));
    expect(n.gastos).toEqual([]);
  });

  // Un borrado no es novedad: puede ser tuyo.
  it("lo que desaparece no se avisa", () => {
    const n = novedades(viaje([taxi, cena]), viaje([taxi]));
    expect(n.gastos).toEqual([]);
  });

  it("al cambiar de viaje no avisa de todo lo del otro", () => {
    const n = novedades(viaje([], [], "v1"), viaje([cena], [ana, luis], "v2"));
    expect(n).toEqual({ gastos: [], viajeros: [] });
  });

  it("sin viaje de antes, tampoco", () => {
    expect(novedades(null, viaje([cena]))).toEqual({ gastos: [], viajeros: [] });
  });
});

describe("textoDeNovedades", () => {
  const todos = [ana, luis];

  it("un gasto, con su cifra y quién lo pagó", () => {
    const texto = textoDeNovedades({ gastos: [cena], viajeros: [] }, todos, "EUR");
    expect(texto).toBe("Nuevo gasto: Cena · 30.00 € (pagó Luis)");
  });

  it("varios, solo cuántos", () => {
    expect(textoDeNovedades({ gastos: [cena, taxi], viajeros: [] }, todos, "EUR")).toBe(
      "2 gastos nuevos"
    );
  });

  it("un viajero que se une", () => {
    const pepe = { id: "c", nombre: "Pepe" };
    expect(textoDeNovedades({ gastos: [], viajeros: [pepe] }, todos, "EUR")).toBe(
      "Se ha unido Pepe"
    );
  });

  it("las dos cosas a la vez", () => {
    const pepe = { id: "c", nombre: "Pepe" };
    expect(textoDeNovedades({ gastos: [cena, taxi], viajeros: [pepe] }, todos, "EUR")).toBe(
      "2 gastos nuevos · Se ha unido Pepe"
    );
  });

  // El que pagó puede haber llegado en la misma tanda y no estar aún en la lista.
  it("si no sabe quién pagó, no se lo inventa", () => {
    const raro = { ...cena, pagadorId: "zzz" };
    expect(textoDeNovedades({ gastos: [raro], viajeros: [] }, todos, "EUR")).toBe(
      "Nuevo gasto: Cena · 30.00 €"
    );
  });

  it("sin nada, null", () => {
    expect(textoDeNovedades({ gastos: [], viajeros: [] }, todos, "EUR")).toBe(null);
  });
});
