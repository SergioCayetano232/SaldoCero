import { describe, it, expect } from "vitest";
import { radioDeLaOnda, siguienteOnda, saltarCasillas } from "./onda";

describe("radioDeLaOnda", () => {
  it("desde el centro llega a las esquinas", () => {
    // Botón de 80 × 60: del centro a una esquina, 50.
    expect(radioDeLaOnda(40, 30, 80, 60)).toBe(50);
  });

  it("desde una esquina tiene que cruzar el botón entero", () => {
    expect(radioDeLaOnda(0, 0, 80, 60)).toBe(100);
    expect(radioDeLaOnda(80, 60, 80, 60)).toBe(100);
  });

  it("redondea hacia arriba, que no quede un pico sin cubrir", () => {
    expect(radioDeLaOnda(0, 0, 10, 10)).toBe(15);
  });
});

describe("siguienteOnda", () => {
  it("va alternando", () => {
    expect(siguienteOnda("a")).toBe("b");
    expect(siguienteOnda("b")).toBe("a");
  });

  // La primera vez el botón aún no tiene nada.
  it("sin nada empieza por la a", () => {
    expect(siguienteOnda(undefined)).toBe("a");
  });
});

describe("saltarCasillas", () => {
  // Un documento de mentira: basta con guardar el oyente y llamarlo a mano.
  function documentoFalso() {
    const oyentes = {};
    return {
      addEventListener: (tipo, f) => (oyentes[tipo] = f),
      removeEventListener: (tipo) => delete oyentes[tipo],
      lanzar: (tipo, target) => oyentes[tipo]?.({ target }),
      oyentes,
    };
  }

  it("cada cambio de una casilla alterna el salto", () => {
    const doc = documentoFalso();
    saltarCasillas(doc);
    const casilla = { type: "checkbox", dataset: {} };
    doc.lanzar("change", casilla);
    expect(casilla.dataset.salto).toBe("a");
    doc.lanzar("change", casilla);
    expect(casilla.dataset.salto).toBe("b");
  });

  it("los campos de texto no saltan", () => {
    const doc = documentoFalso();
    saltarCasillas(doc);
    const campo = { type: "text", dataset: {} };
    doc.lanzar("change", campo);
    expect(campo.dataset.salto).toBeUndefined();
  });

  it("al quitarlo deja de escuchar", () => {
    const doc = documentoFalso();
    const quitar = saltarCasillas(doc);
    quitar();
    expect(doc.oyentes.change).toBeUndefined();
  });
});
