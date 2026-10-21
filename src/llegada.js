// A qué viene la app cuando no la abres tú a mano: con la foto de un ticket
// compartida desde la galería, o desde los atajos del icono: "Apuntar un gasto"
// y "Quién paga a quién".

// Donde deja el service worker la foto compartida. Va repetido en sw.js, que
// no puede importar nada.
export const CACHE_COMPARTIDO = "saldocero-compartido";
export const RUTA_TICKET = "/ticket-compartido";

const QUE_TRAE = ["ticket", "apuntar", "cuentas"];

export function queTrae(busqueda) {
  const parametros = new URLSearchParams(busqueda);
  return QUE_TRAE.find((q) => parametros.has(q)) ?? null;
}

// La dirección sin eso, para que al recargar no vuelva a pasar. El viaje (#) se queda.
export function sinLoQueTrae(direccion) {
  const url = new URL(direccion);
  for (const q of QUE_TRAE) url.searchParams.delete(q);
  return url.pathname + url.search + url.hash;
}

// Lo guardado sale como Blob, sin nombre. Lo demás de la app espera un archivo.
export function archivoDeTicket(blob) {
  const extension = blob.type === "image/png" ? "png" : "jpg";
  return new File([blob], `ticket.${extension}`, { type: blob.type || "image/jpeg" });
}

// La foto que dejó el service worker, una sola vez: después se borra.
export async function recogerTicket(almacen = globalThis.caches) {
  if (!almacen) return null;
  const cache = await almacen.open(CACHE_COMPARTIDO);
  const guardada = await cache.match(RUTA_TICKET);
  if (!guardada) return null;

  await cache.delete(RUTA_TICKET);
  return archivoDeTicket(await guardada.blob());
}
