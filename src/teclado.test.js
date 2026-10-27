import { describe, it, expect } from "vitest";
import { esOrdenador, esAtajoBuscar, esAtajoDeshacer, esAtajoNuevo, esAtajoCuentas, esAtajoDictar, esAtajoLoMio, esAtajoHoy, esAtajoPresupuesto, esAtajoCompartir, esAtajoViajero, esAtajoHistorias, esAtajoBote, esAtajoBajarResumen, esAtajoTema, esAtajoInvitar, esAtajoAyuda, esAtajoGuardar, esAtajoParar, esAtajoOtraVez, escapeEnBuscador, esMac, listaDeAtajos } from "./teclado";

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

describe("esAtajoDictar", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la d, en minúscula o mayúscula, sí", () => {
    expect(esAtajoDictar(tecla("d"))).toBe(true);
    expect(esAtajoDictar(tecla("D", { shiftKey: true }))).toBe(true);
  });

  it("Cmd+D o Ctrl+D son del navegador, no", () => {
    expect(esAtajoDictar(tecla("d", { ctrlKey: true }))).toBe(false);
    expect(esAtajoDictar(tecla("d", { metaKey: true }))).toBe(false);
  });

  it("escribiendo, la d es una d", () => {
    expect(esAtajoDictar(tecla("d", {}, "INPUT"))).toBe(false);
    expect(esAtajoDictar(tecla("d", {}, "TEXTAREA"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoDictar(tecla("d"), true)).toBe(false);
  });
});

describe("esAtajoLoMio", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la m, en minúscula o mayúscula, sí", () => {
    expect(esAtajoLoMio(tecla("m"))).toBe(true);
    expect(esAtajoLoMio(tecla("M", { shiftKey: true }))).toBe(true);
  });

  it("Cmd+M minimiza la ventana, no", () => {
    expect(esAtajoLoMio(tecla("m", { metaKey: true }))).toBe(false);
    expect(esAtajoLoMio(tecla("m", { ctrlKey: true }))).toBe(false);
  });

  it("escribiendo, la m es una m", () => {
    expect(esAtajoLoMio(tecla("m", {}, "INPUT"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoLoMio(tecla("m"), true)).toBe(false);
  });
});

describe("esAtajoHoy", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la h, en minúscula o mayúscula, sí", () => {
    expect(esAtajoHoy(tecla("h"))).toBe(true);
    expect(esAtajoHoy(tecla("H", { shiftKey: true }))).toBe(true);
  });

  it("Cmd+H o Ctrl+H son del sistema y del historial, no", () => {
    expect(esAtajoHoy(tecla("h", { metaKey: true }))).toBe(false);
    expect(esAtajoHoy(tecla("h", { ctrlKey: true }))).toBe(false);
  });

  it("escribiendo, la h es una h", () => {
    expect(esAtajoHoy(tecla("h", {}, "INPUT"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoHoy(tecla("h"), true)).toBe(false);
  });
});

describe("esAtajoPresupuesto", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la p, en minúscula o mayúscula, sí", () => {
    expect(esAtajoPresupuesto(tecla("p"))).toBe(true);
    expect(esAtajoPresupuesto(tecla("P", { shiftKey: true }))).toBe(true);
  });

  it("Cmd+P o Ctrl+P es imprimir, no", () => {
    expect(esAtajoPresupuesto(tecla("p", { metaKey: true }))).toBe(false);
    expect(esAtajoPresupuesto(tecla("p", { ctrlKey: true }))).toBe(false);
  });

  it("escribiendo, la p es una p", () => {
    expect(esAtajoPresupuesto(tecla("p", {}, "INPUT"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoPresupuesto(tecla("p"), true)).toBe(false);
  });
});

describe("esAtajoCompartir", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la s, en minúscula o mayúscula, sí", () => {
    expect(esAtajoCompartir(tecla("s"))).toBe(true);
    expect(esAtajoCompartir(tecla("S", { shiftKey: true }))).toBe(true);
  });

  it("Cmd+S o Ctrl+S es guardar la página, no", () => {
    expect(esAtajoCompartir(tecla("s", { metaKey: true }))).toBe(false);
    expect(esAtajoCompartir(tecla("s", { ctrlKey: true }))).toBe(false);
  });

  it("escribiendo, la s es una s", () => {
    expect(esAtajoCompartir(tecla("s", {}, "INPUT"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoCompartir(tecla("s"), true)).toBe(false);
  });
});

describe("esAtajoViajero", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la a, en minúscula o mayúscula, sí", () => {
    expect(esAtajoViajero(tecla("a"))).toBe(true);
    expect(esAtajoViajero(tecla("A", { shiftKey: true }))).toBe(true);
  });

  it("Cmd+A o Ctrl+A es seleccionarlo todo, no", () => {
    expect(esAtajoViajero(tecla("a", { metaKey: true }))).toBe(false);
    expect(esAtajoViajero(tecla("a", { ctrlKey: true }))).toBe(false);
  });

  it("escribiendo, la a es una a", () => {
    expect(esAtajoViajero(tecla("a", {}, "INPUT"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoViajero(tecla("a"), true)).toBe(false);
  });
});

describe("esAtajoHistorias", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la v, en minúscula o mayúscula, sí", () => {
    expect(esAtajoHistorias(tecla("v"))).toBe(true);
    expect(esAtajoHistorias(tecla("V", { shiftKey: true }))).toBe(true);
  });

  it("Cmd+V o Ctrl+V es pegar, no", () => {
    expect(esAtajoHistorias(tecla("v", { metaKey: true }))).toBe(false);
    expect(esAtajoHistorias(tecla("v", { ctrlKey: true }))).toBe(false);
  });

  it("escribiendo, la v es una v", () => {
    expect(esAtajoHistorias(tecla("v", {}, "INPUT"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoHistorias(tecla("v"), true)).toBe(false);
  });
});

describe("esAtajoBote", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la b, en minúscula o mayúscula, sí", () => {
    expect(esAtajoBote(tecla("b"))).toBe(true);
    expect(esAtajoBote(tecla("B", { shiftKey: true }))).toBe(true);
  });

  it("Cmd+B o Ctrl+B son del navegador, no", () => {
    expect(esAtajoBote(tecla("b", { metaKey: true }))).toBe(false);
    expect(esAtajoBote(tecla("b", { ctrlKey: true }))).toBe(false);
  });

  it("escribiendo, la b es una b", () => {
    expect(esAtajoBote(tecla("b", {}, "INPUT"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoBote(tecla("b"), true)).toBe(false);
  });
});

describe("esAtajoBajarResumen", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la g, en minúscula o mayúscula, sí", () => {
    expect(esAtajoBajarResumen(tecla("g"))).toBe(true);
    expect(esAtajoBajarResumen(tecla("G", { shiftKey: true }))).toBe(true);
  });

  it("Cmd+G o Ctrl+G es buscar el siguiente, no", () => {
    expect(esAtajoBajarResumen(tecla("g", { metaKey: true }))).toBe(false);
    expect(esAtajoBajarResumen(tecla("g", { ctrlKey: true }))).toBe(false);
  });

  it("escribiendo, la g es una g", () => {
    expect(esAtajoBajarResumen(tecla("g", {}, "INPUT"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoBajarResumen(tecla("g"), true)).toBe(false);
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

describe("esAtajoInvitar", () => {
  const tecla = (key, extra = {}, tagName = "BODY") => ({ key, target: { tagName }, ...extra });

  it("la i, en minúscula o mayúscula, sí", () => {
    expect(esAtajoInvitar(tecla("i"))).toBe(true);
    expect(esAtajoInvitar(tecla("I", { shiftKey: true }))).toBe(true);
  });

  it("Cmd+I o Ctrl+I son otra cosa, no", () => {
    expect(esAtajoInvitar(tecla("i", { ctrlKey: true }))).toBe(false);
    expect(esAtajoInvitar(tecla("i", { metaKey: true }))).toBe(false);
  });

  it("escribiendo, la i es una i", () => {
    expect(esAtajoInvitar(tecla("i", {}, "INPUT"))).toBe(false);
  });

  it("con una ventana abierta, no", () => {
    expect(esAtajoInvitar(tecla("i"), true)).toBe(false);
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

describe("esAtajoParar", () => {
  const tecla = (key, extra = {}) => ({ key, target: { tagName: "BUTTON" }, ...extra });

  it("el espacio, sí", () => {
    expect(esAtajoParar(tecla(" "))).toBe(true);
    expect(esAtajoParar(tecla(" ", { shiftKey: true }))).toBe(true);
  });

  it("con Ctrl, Cmd o Alt es otra cosa", () => {
    expect(esAtajoParar(tecla(" ", { ctrlKey: true }))).toBe(false);
    expect(esAtajoParar(tecla(" ", { metaKey: true }))).toBe(false);
    expect(esAtajoParar(tecla(" ", { altKey: true }))).toBe(false);
  });

  it("otras teclas, no", () => {
    expect(esAtajoParar(tecla("Enter"))).toBe(false);
    expect(esAtajoParar(tecla("p"))).toBe(false);
  });
});

describe("esAtajoOtraVez", () => {
  const tecla = (key, extra = {}) => ({ key, target: { tagName: "BUTTON" }, ...extra });

  it("la r, en minúscula o mayúscula, sí", () => {
    expect(esAtajoOtraVez(tecla("r"))).toBe(true);
    expect(esAtajoOtraVez(tecla("R", { shiftKey: true }))).toBe(true);
  });

  it("Cmd+R o Ctrl+R es recargar, no", () => {
    expect(esAtajoOtraVez(tecla("r", { metaKey: true }))).toBe(false);
    expect(esAtajoOtraVez(tecla("r", { ctrlKey: true }))).toBe(false);
  });

  it("otras teclas, no", () => {
    expect(esAtajoOtraVez(tecla("t"))).toBe(false);
  });
});

describe("escapeEnBuscador", () => {
  it("con algo escrito, lo vacía", () => {
    expect(escapeEnBuscador("cena")).toBe("vaciar");
  });

  it("vacío, te saca del campo", () => {
    expect(escapeEnBuscador("")).toBe("salir");
  });
});

describe("listaDeAtajos", () => {
  it("la D solo si se puede dictar", () => {
    expect(listaDeAtajos(false, true).some((a) => a.teclas.includes("D"))).toBe(true);
    expect(listaDeAtajos(false, false).some((a) => a.teclas.includes("D"))).toBe(false);
  });

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
    expect(teclas).toEqual(["A", "N", "/", "M", "H", "C", "P", "B", "S", "G", "I", "V", "T", "Enter", "Z", "Esc", "?"]);
    expect(listaDeAtajos(false, true).map((a) => a.teclas.at(-1))).toEqual(["A", "N", "D", "/", "M", "H", "C", "P", "B", "S", "G", "I", "V", "T", "Enter", "Z", "Esc", "?"]);
  });
});
