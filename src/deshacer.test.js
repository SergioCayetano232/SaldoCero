import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { borradoConEspera, ESPERA, queSeVaConViajero } from "./deshacer";

// Controlamos el reloj, que si no habría que esperar de verdad.
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("borradoConEspera", () => {
  it("no borra nada hasta que pasa el tiempo", () => {
    const borrar = vi.fn();
    borradoConEspera(borrar);

    vi.advanceTimersByTime(ESPERA - 100);
    expect(borrar).not.toHaveBeenCalled();
  });

  it("pasado el tiempo, borra", async () => {
    const borrar = vi.fn().mockResolvedValue();
    borradoConEspera(borrar);

    await vi.advanceTimersByTimeAsync(ESPERA);
    expect(borrar).toHaveBeenCalledOnce();
  });

  it("si cancelas, no se borra", async () => {
    const borrar = vi.fn();
    const { cancelar } = borradoConEspera(borrar);

    expect(cancelar()).toBe(true);
    await vi.advanceTimersByTimeAsync(ESPERA * 2);
    expect(borrar).not.toHaveBeenCalled();
  });

  it("cancelar cuando ya se ha borrado no sirve de nada", async () => {
    const borrar = vi.fn().mockResolvedValue();
    const { cancelar } = borradoConEspera(borrar);

    await vi.advanceTimersByTimeAsync(ESPERA);
    expect(cancelar()).toBe(false);
    expect(borrar).toHaveBeenCalledOnce();
  });

  it("se puede borrar ya, sin esperar", async () => {
    const borrar = vi.fn().mockResolvedValue();
    const { ahora } = borradoConEspera(borrar);

    await ahora();
    expect(borrar).toHaveBeenCalledOnce();
  });

  it("borrar ya dos veces no borra dos veces", async () => {
    const borrar = vi.fn().mockResolvedValue();
    const { ahora } = borradoConEspera(borrar);

    await ahora();
    await ahora();
    expect(borrar).toHaveBeenCalledOnce();
  });

  it("avisa cuando ha terminado bien", async () => {
    const alTerminar = vi.fn();
    borradoConEspera(vi.fn().mockResolvedValue(), alTerminar);

    await vi.advanceTimersByTimeAsync(ESPERA);
    expect(alTerminar).toHaveBeenCalledWith(null);
  });

  it("y avisa con el fallo si algo sale mal", async () => {
    const pega = new Error("sin conexión");
    const alTerminar = vi.fn();
    borradoConEspera(vi.fn().mockRejectedValue(pega), alTerminar);

    await vi.advanceTimersByTimeAsync(ESPERA);
    expect(alTerminar).toHaveBeenCalledWith(pega);
  });

  it("cancelar a tiempo tampoco llama al aviso", async () => {
    const alTerminar = vi.fn();
    const { cancelar } = borradoConEspera(vi.fn(), alTerminar);

    cancelar();
    await vi.advanceTimersByTimeAsync(ESPERA * 2);
    expect(alTerminar).not.toHaveBeenCalled();
  });
});

describe("queSeVaConViajero", () => {
  const luis = { id: "l", nombre: "Luis" };
  const gastos = [
    { pagadorId: "l", importe: 30 },
    { pagadorId: "a", importe: 50 },
    { pagadorId: "l", importe: 45.5, importeConvertido: 12.25 },
  ];

  it("si no pagó nada, solo el nombre", () => {
    expect(queSeVaConViajero(luis, [{ pagadorId: "a", importe: 50 }])).toBe("a Luis");
  });

  it("con un gasto, en singular", () => {
    expect(queSeVaConViajero(luis, gastos.slice(0, 2))).toBe("a Luis y el gasto que pagó (30.00 €)");
  });

  it("con varios, cuántos y cuánto en la moneda del viaje", () => {
    expect(queSeVaConViajero(luis, gastos)).toBe("a Luis y los 2 gastos que pagó (42.25 €)");
  });

  it("con la moneda del viaje", () => {
    expect(queSeVaConViajero(luis, gastos.slice(0, 1), "USD")).toBe("a Luis y el gasto que pagó ($30.00)");
  });
});
