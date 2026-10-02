import { describe, it, expect, vi, beforeEach } from "vitest";

// Un Supabase de mentira: cada consulta devuelve lo que le digamos en `respuesta`.
const respuesta = { data: [], error: null };
const quitarFotos = vi.fn(async () => ({ error: null }));

function consulta() {
  const c = {
    delete: () => c,
    eq: () => c,
    select: () => c,
    single: () => c,
    then: (bien, mal) => Promise.resolve({ ...respuesta }).then(bien, mal),
  };
  return c;
}

vi.mock("./supabase", () => ({
  supabase: {
    from: () => consulta(),
    storage: { from: () => ({ remove: quitarFotos }) },
  },
  usarCodigo: () => {},
}));

const { quitarGasto, quitarViajero, quitarParcial, vaciarViaje } = await import("./datos");

beforeEach(() => {
  respuesta.data = [];
  respuesta.error = null;
  quitarFotos.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// Con el viaje cerrado desde otro móvil, la base de datos no da error: borra
// cero filas y ya. Hay que darse cuenta igual.
describe("borrar sin que se borre nada", () => {
  it("un gasto que no se ha borrado da error", async () => {
    await expect(quitarGasto("g1")).rejects.toThrow("No hemos podido quitar el gasto.");
  });

  it("y no se lleva su foto por delante", async () => {
    await expect(quitarGasto("g1", "v1/g1-abc.jpg")).rejects.toThrow();
    expect(quitarFotos).not.toHaveBeenCalled();
  });

  it("un viajero, igual", async () => {
    await expect(quitarViajero("a")).rejects.toThrow("No hemos podido quitar al viajero.");
  });

  it("un pago a cuenta, igual", async () => {
    await expect(quitarParcial("p1")).rejects.toThrow("No hemos podido quitar el pago.");
  });
});

describe("borrar de verdad", () => {
  beforeEach(() => {
    respuesta.data = [{ id: "x" }];
  });

  it("el gasto se va, y su foto con él", async () => {
    await quitarGasto("g1", "v1/g1-abc.jpg");
    expect(quitarFotos).toHaveBeenCalledWith(["v1/g1-abc.jpg"]);
  });

  it("sin foto, no toca el bucket", async () => {
    await quitarGasto("g1");
    expect(quitarFotos).not.toHaveBeenCalled();
  });

  it("viajeros y pagos, sin error", async () => {
    await expect(quitarViajero("a")).resolves.toBeUndefined();
    await expect(quitarParcial("p1")).resolves.toBeUndefined();
  });
});

describe("vaciar el viaje", () => {
  it("si se ha cerrado desde otro móvil, no toca nada y lo dice", async () => {
    respuesta.data = { cerrado_en: "2026-10-02T10:00:00Z" };
    await expect(vaciarViaje("v1")).rejects.toThrow("El viaje está cerrado");
  });
});
