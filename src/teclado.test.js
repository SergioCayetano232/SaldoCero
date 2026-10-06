import { describe, it, expect } from "vitest";
import { esOrdenador, esAtajoBuscar } from "./teclado";

const con = (matches) => ({ matchMedia: () => ({ matches }) });

describe("esOrdenador", () => {
  it("con ratón, sí", () => {
    expect(esOrdenador(con(true))).toBe(true);
  });

  it("con el dedo, no", () => {
    expect(esOrdenador(con(false))).toBe(false);
  });

  it("si el navegador no sabe decirlo, mejor no", () => {
    expect(esOrdenador({})).toBe(false);
    expect(esOrdenador(undefined)).toBe(false);
  });
});

describe("esAtajoBuscar", () => {
  const tecla = (key, tagName = "BODY", extra = {}) => ({ key, target: { tagName }, ...extra });

  it("la barra, con la página sin nada escrito, sí", () => {
    expect(esAtajoBuscar(tecla("/"))).toBe(true);
    expect(esAtajoBuscar(tecla("/", "BUTTON"))).toBe(true);
  });

  it("otra tecla, no", () => {
    expect(esAtajoBuscar(tecla("a"))).toBe(false);
  });

  it("escribiendo en un campo, la barra es una barra", () => {
    expect(esAtajoBuscar(tecla("/", "INPUT"))).toBe(false);
    expect(esAtajoBuscar(tecla("/", "TEXTAREA"))).toBe(false);
    expect(esAtajoBuscar(tecla("/", "SELECT"))).toBe(false);
    expect(esAtajoBuscar(tecla("/", "DIV", { target: { tagName: "DIV", isContentEditable: true } }))).toBe(false);
  });

  it("con Ctrl, Cmd o Alt es otro atajo", () => {
    expect(esAtajoBuscar(tecla("/", "BODY", { ctrlKey: true }))).toBe(false);
    expect(esAtajoBuscar(tecla("/", "BODY", { metaKey: true }))).toBe(false);
    expect(esAtajoBuscar(tecla("/", "BODY", { altKey: true }))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoBuscar(tecla("/"), true)).toBe(false);
  });
});
