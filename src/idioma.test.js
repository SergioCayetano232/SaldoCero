import { describe, it, expect, afterEach } from "vitest";
import { t, tn, idiomaDelMovil, idiomaGuardado, guardarIdioma, usarIdioma, idiomaActual, alCambiarIdioma, otroIdioma, formatoFechas } from "./idioma";
import EN from "./textos/en";

afterEach(() => usarIdioma("es"));

function almacenDePrueba(inicial = {}) {
  const datos = { ...inicial };
  return { getItem: (k) => datos[k] ?? null, setItem: (k, v) => (datos[k] = String(v)) };
}

describe("idiomaDelMovil", () => {
  it("español y las lenguas de aquí, en español", () => {
    expect(idiomaDelMovil(["es-ES"])).toBe("es");
    expect(idiomaDelMovil(["es"])).toBe("es");
    expect(idiomaDelMovil(["ca-ES", "en"])).toBe("es");
    expect(idiomaDelMovil(["eu"])).toBe("es");
    expect(idiomaDelMovil(["gl-ES"])).toBe("es");
  });

  it("el resto, en inglés", () => {
    expect(idiomaDelMovil(["en-GB"])).toBe("en");
    expect(idiomaDelMovil(["de-DE", "es"])).toBe("en");
    expect(idiomaDelMovil(["fr"])).toBe("en");
  });

  it("sin saberlo, español", () => {
    expect(idiomaDelMovil([])).toBe("es");
    expect(idiomaDelMovil()).toBe("es");
  });

  it("no se confunde con lenguas que empiezan igual", () => {
    expect(idiomaDelMovil(["cat"])).toBe("en");
  });
});

describe("guardarlo", () => {
  it("se acuerda del elegido", () => {
    const almacen = almacenDePrueba();
    expect(idiomaGuardado(almacen)).toBeNull();
    guardarIdioma("en", almacen);
    expect(idiomaGuardado(almacen)).toBe("en");
  });

  it("lo que no es un idioma nuestro, nada", () => {
    expect(idiomaGuardado(almacenDePrueba({ "saldocero-idioma": "fr" }))).toBeNull();
  });

  it("si el almacén falla, no rompe", () => {
    const roto = { getItem: () => { throw new Error("no"); }, setItem: () => { throw new Error("no"); } };
    expect(idiomaGuardado(roto)).toBeNull();
    expect(() => guardarIdioma("en", roto)).not.toThrow();
  });
});

describe("t", () => {
  it("en español, el texto tal cual", () => {
    expect(t("Crear")).toBe("Crear");
  });

  it("en inglés, el traducido", () => {
    usarIdioma("en");
    expect(t("Crear")).toBe("Create");
  });

  it("lo que no está traducido sale en español", () => {
    usarIdioma("en");
    expect(t("Esto no está en el diccionario")).toBe("Esto no está en el diccionario");
  });

  it("rellena los huecos", () => {
    expect(t("debes {cifra}", { cifra: "20.00 €" })).toBe("debes 20.00 €");
    expect(t("debes {cifra}", { cifra: "20.00 €" }, "en")).toBe("you owe 20.00 €");
  });

  it("un hueco sin dato se queda como está", () => {
    expect(t("Hola {nombre}")).toBe("Hola {nombre}");
  });

  it("con plural", () => {
    expect(tn(1, "{n} gasto", "{n} gastos")).toBe("1 gasto");
    expect(tn(3, "{n} gasto", "{n} gastos", undefined, "en")).toBe("3 expenses");
  });
});

describe("cambiar de idioma", () => {
  it("avisa a quien escucha, y solo si cambia", () => {
    let veces = 0;
    const dejar = alCambiarIdioma(() => veces++);
    usarIdioma("en");
    usarIdioma("en");
    expect(veces).toBe(1);
    expect(idiomaActual()).toBe("en");
    dejar();
    usarIdioma("es");
    expect(veces).toBe(1);
  });

  it("uno raro, español", () => {
    usarIdioma("en");
    usarIdioma("klingon");
    expect(idiomaActual()).toBe("es");
  });

  it("el otro y el formato de las fechas", () => {
    expect(otroIdioma("es")).toBe("en");
    expect(otroIdioma("en")).toBe("es");
    expect(formatoFechas("es")).toBe("es-ES");
    expect(formatoFechas("en")).toBe("en-GB");
  });
});

describe("el diccionario en inglés", () => {
  const huecos = (texto) => [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  it("cada traducción lleva los mismos huecos que el original", () => {
    const mal = Object.entries(EN).filter(([es, en]) => huecos(es).join() !== huecos(en).join());
    expect(mal).toEqual([]);
  });

  it("no hay ninguna vacía", () => {
    expect(Object.entries(EN).filter(([, en]) => !en.trim())).toEqual([]);
  });
});
