import { describe, it, expect } from "vitest";
import { textoAlGuardar } from "./apuntado";

describe("textoAlGuardar", () => {
  it("sin nada recién guardado, el de siempre", () => {
    expect(textoAlGuardar(null)).toBe("Añadir gasto");
  });

  it("recién apuntado, lo dice", () => {
    expect(textoAlGuardar("anadido")).toBe("✓ Apuntado");
  });

  it("y si venías de editar, que se guardaron los cambios", () => {
    expect(textoAlGuardar("editado")).toBe("✓ Cambios guardados");
  });
});
