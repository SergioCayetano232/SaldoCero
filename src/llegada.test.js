import { describe, it, expect } from "vitest";
import { queTrae, sinLoQueTrae, archivoDeTicket, recogerTicket, RUTA_TICKET } from "./llegada";

describe("queTrae", () => {
  it("la foto compartida o el atajo de apuntar", () => {
    expect(queTrae("?ticket")).toBe("ticket");
    expect(queTrae("?apuntar")).toBe("apuntar");
    expect(queTrae("?apuntar=1&otra=2")).toBe("apuntar");
  });

  it("si no trae nada, null", () => {
    expect(queTrae("")).toBeNull();
    expect(queTrae("?otra=1")).toBeNull();
  });
});

describe("sinLoQueTrae", () => {
  it("lo quita y deja el viaje", () => {
    expect(sinLoQueTrae("https://saldo.app/?ticket#ABC123")).toBe("/#ABC123");
    expect(sinLoQueTrae("https://saldo.app/?apuntar&x=1")).toBe("/?x=1");
  });
});

describe("archivoDeTicket", () => {
  it("le pone nombre y tipo", () => {
    const archivo = archivoDeTicket(new Blob(["x"], { type: "image/png" }));
    expect(archivo.name).toBe("ticket.png");
    expect(archivo.type).toBe("image/png");
  });

  it("sin tipo, como un jpg", () => {
    const archivo = archivoDeTicket(new Blob(["x"]));
    expect(archivo.name).toBe("ticket.jpg");
    expect(archivo.type).toBe("image/jpeg");
  });
});

describe("recogerTicket", () => {
  // Una caché de mentira, con lo justo.
  function almacen(guardado) {
    const datos = new Map(guardado ? [[RUTA_TICKET, guardado]] : []);
    return {
      open: async () => ({
        match: async (ruta) => datos.get(ruta),
        delete: async (ruta) => datos.delete(ruta),
      }),
      datos,
    };
  }

  it("la saca una vez y la borra", async () => {
    const a = almacen(new Response(new Blob(["foto"], { type: "image/jpeg" })));
    const archivo = await recogerTicket(a);
    expect(archivo.name).toBe("ticket.jpg");
    expect(a.datos.size).toBe(0);
    expect(await recogerTicket(a)).toBeNull();
  });

  it("sin caché en el navegador, nada", async () => {
    expect(await recogerTicket(null)).toBeNull();
  });
});
