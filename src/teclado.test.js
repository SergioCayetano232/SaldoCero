import { describe, it, expect } from "vitest";
import { esOrdenador, esAtajoBuscar, esAtajoDeshacer } from "./teclado";

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

describe("esAtajoDeshacer", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("Ctrl+Z o Cmd+Z, sí", () => {
    expect(esAtajoDeshacer(tecla("z", { ctrlKey: true }))).toBe(true);
    expect(esAtajoDeshacer(tecla("z", { metaKey: true }))).toBe(true);
    expect(esAtajoDeshacer(tecla("Z", { ctrlKey: true }))).toBe(true);
  });

  it("la z sola es una z", () => {
    expect(esAtajoDeshacer(tecla("z"))).toBe(false);
  });

  it("con mayúsculas es rehacer, no", () => {
    expect(esAtajoDeshacer(tecla("z", { metaKey: true, shiftKey: true }))).toBe(false);
  });

  it("escribiendo en un campo deshace el texto, no el borrado", () => {
    expect(esAtajoDeshacer(tecla("z", { ctrlKey: true }, "INPUT"))).toBe(false);
    expect(esAtajoDeshacer(tecla("z", { ctrlKey: true }, "TEXTAREA"))).toBe(false);
  });
});
