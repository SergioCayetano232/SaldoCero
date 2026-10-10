import { describe, it, expect, vi } from "vitest";
import { cuantosMios, ponerGlobito } from "./globito";

const pago = (deId, aId, saldado = false) => ({ deId, aId, cantidad: 10, saldado });

describe("cuantosMios", () => {
  const pagos = [pago("a", "b"), pago("c", "a"), pago("b", "c"), pago("a", "c", true)];

  it("los que me tocan, pague o cobre, sin los ya pagados", () => {
    expect(cuantosMios(pagos, "a")).toBe(2);
  });

  it("si no sé quién eres, ninguno", () => {
    expect(cuantosMios(pagos, null)).toBe(0);
  });

  it("si no tienes nada pendiente, cero", () => {
    expect(cuantosMios(pagos, "z")).toBe(0);
  });
});

describe("ponerGlobito", () => {
  const navegador = () => ({
    setAppBadge: vi.fn(() => Promise.resolve()),
    clearAppBadge: vi.fn(() => Promise.resolve()),
  });

  it("con pendientes, pone el número", () => {
    const nav = navegador();
    ponerGlobito(3, nav);
    expect(nav.setAppBadge).toHaveBeenCalledWith(3);
  });

  it("con cero, lo quita", () => {
    const nav = navegador();
    ponerGlobito(0, nav);
    expect(nav.clearAppBadge).toHaveBeenCalled();
    expect(nav.setAppBadge).not.toHaveBeenCalled();
  });

  it("si el navegador no sabe, no falla", () => {
    expect(() => ponerGlobito(2, {})).not.toThrow();
    expect(() => ponerGlobito(2, undefined)).not.toThrow();
  });

  it("si lo rechaza, tampoco", async () => {
    const nav = { setAppBadge: () => Promise.reject(new Error("sin permiso")), clearAppBadge: () => {} };
    expect(() => ponerGlobito(1, nav)).not.toThrow();
    await Promise.resolve();
  });
});
