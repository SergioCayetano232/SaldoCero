import { describe, it, expect, vi } from "vitest";
import { mantenerEncendida } from "./pantalla";

const navegador = (request) => ({ wakeLock: { request: vi.fn(request) } });

describe("mantenerEncendida", () => {
  it("pide que no se apague y luego la suelta", async () => {
    const cerrojo = { release: vi.fn(() => Promise.resolve()) };
    const nav = navegador(() => Promise.resolve(cerrojo));

    const soltar = await mantenerEncendida(nav);
    expect(nav.wakeLock.request).toHaveBeenCalledWith("screen");
    expect(cerrojo.release).not.toHaveBeenCalled();

    soltar();
    expect(cerrojo.release).toHaveBeenCalled();
  });

  it("donde no existe, no hace nada", async () => {
    const soltar = await mantenerEncendida({});
    expect(() => soltar()).not.toThrow();
  });

  it("si el navegador dice que no, tampoco rompe", async () => {
    const nav = navegador(() => Promise.reject(new Error("batería baja")));
    const soltar = await mantenerEncendida(nav);
    expect(() => soltar()).not.toThrow();
  });

  it("si ya estaba suelta, soltarla otra vez no rompe", async () => {
    const cerrojo = { release: () => Promise.reject(new Error("ya suelta")) };
    const soltar = await mantenerEncendida(navegador(() => Promise.resolve(cerrojo)));
    expect(() => soltar()).not.toThrow();
  });
});
