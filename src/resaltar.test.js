import { describe, it, expect } from "vitest";
import { trozosResaltados } from "./resaltar";

const marcado = (trozos) => trozos.filter((t) => t.resaltado).map((t) => t.texto);
const entero = (trozos) => trozos.map((t) => t.texto).join("");

describe("trozosResaltados", () => {
  it("marca lo buscado y deja lo demás", () => {
    expect(trozosResaltados("Cena en la plaza", "plaza")).toEqual([
      { texto: "Cena en la ", resaltado: false },
      { texto: "plaza", resaltado: true },
    ]);
  });

  it("da igual tildes y mayúsculas, y marca el texto tal cual está", () => {
    const trozos = trozosResaltados("Cafetería", "TERIA");
    expect(marcado(trozos)).toEqual(["tería"]);
    expect(entero(trozos)).toBe("Cafetería");
  });

  it("y al revés, buscando con tilde", () => {
    expect(marcado(trozosResaltados("Cafeteria", "tería"))).toEqual(["teria"]);
  });

  it("todas las veces que salga", () => {
    expect(marcado(trozosResaltados("Café y café", "cafe"))).toEqual(["Café", "café"]);
  });

  it("con espacios dentro de lo buscado", () => {
    expect(marcado(trozosResaltados("Cena en la plaza", "en la"))).toEqual(["en la"]);
  });

  it("con emojis delante no se descuadra", () => {
    const trozos = trozosResaltados("🍕 Pizza", "pizza");
    expect(marcado(trozos)).toEqual(["Pizza"]);
    expect(entero(trozos)).toBe("🍕 Pizza");
  });

  it("sin buscar nada, o si no está, el texto entero sin marcar", () => {
    expect(trozosResaltados("Taxi", "")).toEqual([{ texto: "Taxi", resaltado: false }]);
    expect(trozosResaltados("Taxi", "   ")).toEqual([{ texto: "Taxi", resaltado: false }]);
    expect(trozosResaltados("Taxi", "museo")).toEqual([{ texto: "Taxi", resaltado: false }]);
  });

  it("sin texto, vacío", () => {
    expect(trozosResaltados(null, "taxi")).toEqual([{ texto: "", resaltado: false }]);
  });
});
