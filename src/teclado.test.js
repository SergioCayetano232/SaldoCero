import { describe, it, expect } from "vitest";
import { esOrdenador, esAtajoBuscar, esAtajoDeshacer, esAtajoNuevo, esAtajoCuentas, esAtajoTema, esAtajoAyuda, esAtajoGuardar, esMac, listaDeAtajos } from "./teclado";

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

describe("esAtajoNuevo", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la n, en minúscula o mayúscula, sí", () => {
    expect(esAtajoNuevo(tecla("n"))).toBe(true);
    expect(esAtajoNuevo(tecla("N", { shiftKey: true }))).toBe(true);
  });

  it("Ctrl+N o Cmd+N abren otra ventana, no", () => {
    expect(esAtajoNuevo(tecla("n", { ctrlKey: true }))).toBe(false);
    expect(esAtajoNuevo(tecla("n", { metaKey: true }))).toBe(false);
  });

  it("escribiendo, la n es una n", () => {
    expect(esAtajoNuevo(tecla("n", {}, "INPUT"))).toBe(false);
    expect(esAtajoNuevo(tecla("n", {}, "SELECT"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoNuevo(tecla("n"), true)).toBe(false);
  });
});

describe("esAtajoCuentas", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la c, en minúscula o mayúscula, sí", () => {
    expect(esAtajoCuentas(tecla("c"))).toBe(true);
    expect(esAtajoCuentas(tecla("C", { shiftKey: true }))).toBe(true);
  });

  it("Ctrl+C o Cmd+C es copiar, no", () => {
    expect(esAtajoCuentas(tecla("c", { ctrlKey: true }))).toBe(false);
    expect(esAtajoCuentas(tecla("c", { metaKey: true }))).toBe(false);
  });

  it("escribiendo, la c es una c", () => {
    expect(esAtajoCuentas(tecla("c", {}, "INPUT"))).toBe(false);
    expect(esAtajoCuentas(tecla("c", {}, "TEXTAREA"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoCuentas(tecla("c"), true)).toBe(false);
  });
});

describe("esAtajoTema", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la t, en minúscula o mayúscula, sí", () => {
    expect(esAtajoTema(tecla("t"))).toBe(true);
    expect(esAtajoTema(tecla("T", { shiftKey: true }))).toBe(true);
  });

  it("Ctrl+T o Cmd+T abren una pestaña, no", () => {
    expect(esAtajoTema(tecla("t", { ctrlKey: true }))).toBe(false);
    expect(esAtajoTema(tecla("t", { metaKey: true }))).toBe(false);
  });

  it("escribiendo, la t es una t", () => {
    expect(esAtajoTema(tecla("t", {}, "INPUT"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoTema(tecla("t"), true)).toBe(false);
  });
});

describe("esAtajoAyuda", () => {
  const tecla = (key, tagName = "BODY", extra = {}) => ({ key, target: { tagName }, ...extra });

  it("la interrogación, sí, aunque lleve Mayúsculas", () => {
    expect(esAtajoAyuda(tecla("?", "BODY", { shiftKey: true }))).toBe(true);
  });

  it("escribiendo, la interrogación es una interrogación", () => {
    expect(esAtajoAyuda(tecla("?", "INPUT"))).toBe(false);
    expect(esAtajoAyuda(tecla("?", "TEXTAREA"))).toBe(false);
  });

  it("con otra ventana abierta, no", () => {
    expect(esAtajoAyuda(tecla("?"), true)).toBe(false);
  });

  it("con Ctrl, Cmd o Alt, no", () => {
    expect(esAtajoAyuda(tecla("?", "BODY", { ctrlKey: true }))).toBe(false);
    expect(esAtajoAyuda(tecla("?", "BODY", { metaKey: true }))).toBe(false);
    expect(esAtajoAyuda(tecla("?", "BODY", { altKey: true }))).toBe(false);
  });

  it("la barra sola no, que es la del buscador", () => {
    expect(esAtajoAyuda(tecla("/"))).toBe(false);
  });
});

describe("esMac", () => {
  it("en Mac, sí", () => {
    expect(esMac({ platform: "MacIntel" })).toBe(true);
  });

  it("en Windows, no", () => {
    expect(esMac({ platform: "Win32" })).toBe(false);
  });

  it("si no trae platform, mira el userAgent", () => {
    expect(esMac({ platform: "", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" })).toBe(true);
  });

  it("sin navegador, no", () => {
    expect(esMac(null)).toBe(false);
  });
});

describe("esAtajoGuardar", () => {
  const tecla = (key, extra = {}) => ({ key, target: { tagName: "SELECT" }, ...extra });

  it("Ctrl+Enter o Cmd+Enter, sí, también desde un campo", () => {
    expect(esAtajoGuardar(tecla("Enter", { ctrlKey: true }))).toBe(true);
    expect(esAtajoGuardar(tecla("Enter", { metaKey: true }))).toBe(true);
  });

  it("Enter solo, no", () => {
    expect(esAtajoGuardar(tecla("Enter"))).toBe(false);
  });

  it("con Mayúsculas o Alt, no", () => {
    expect(esAtajoGuardar(tecla("Enter", { ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(esAtajoGuardar(tecla("Enter", { ctrlKey: true, altKey: true }))).toBe(false);
  });

  it("otra tecla con Ctrl, no", () => {
    expect(esAtajoGuardar(tecla("s", { ctrlKey: true }))).toBe(false);
  });
});

describe("listaDeAtajos", () => {
  it("en Mac, deshacer va con ⌘", () => {
    const deshacer = listaDeAtajos(true).find((a) => a.teclas.includes("Z"));
    expect(deshacer.teclas).toEqual(["⌘", "Z"]);
  });

  it("si no, con Ctrl", () => {
    const deshacer = listaDeAtajos(false).find((a) => a.teclas.includes("Z"));
    expect(deshacer.teclas).toEqual(["Ctrl", "Z"]);
  });

  it("están todos los que hay", () => {
    const teclas = listaDeAtajos().map((a) => a.teclas.at(-1));
    expect(teclas).toEqual(["N", "/", "C", "T", "Enter", "Z", "Esc", "?"]);
  });
});
