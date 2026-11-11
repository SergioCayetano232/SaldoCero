// La foto del ticket de un gasto.

import { t } from "./idioma";

// Una foto del móvil son 4 MB. A 1600 px el ticket se lee igual y ocupa unos
// 200 KB, que el Storage gratis es de 1 GB.
export const LADO_MAXIMO = 1600;
const CALIDAD = 0.8;

// La medida a la que se queda, sin deformarla. Si ya es pequeña, no se toca.
export function medidaReducida(ancho, alto, maximo = LADO_MAXIMO) {
  const mayor = Math.max(ancho, alto);
  if (mayor <= maximo) return { ancho, alto };

  const escala = maximo / mayor;
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
}

// Primero la carpeta del viaje: las reglas del Storage miran eso para dejarte
// verla. Lo aleatorio es para que al cambiar la foto no se quede la vieja en caché.
export function rutaDelTicket(viajeId, gastoId, aleatorio = crypto.randomUUID()) {
  return `${viajeId}/${gastoId}-${aleatorio.slice(0, 8)}.jpg`;
}

export function esImagen(archivo) {
  return Boolean(archivo?.type?.startsWith("image/"));
}

// Reducida y en JPEG. Sin librerías: el navegador ya sabe hacerlo con un canvas.
export async function reducirFoto(archivo) {
  let imagen;
  try {
    // imageOrientation, para que la foto hecha en vertical no salga tumbada.
    imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  } catch {
    // Pasa con las HEIC del iPhone en un navegador que no las sabe abrir.
    throw new Error(t("No hemos podido leer la foto. Prueba con otra o hazle una captura."));
  }
  const { ancho, alto } = medidaReducida(imagen.width, imagen.height);

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  lienzo.getContext("2d").drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  return new Promise((resolver, fallar) =>
    lienzo.toBlob(
      (blob) => (blob ? resolver(blob) : fallar(new Error(t("No hemos podido leer la foto. Prueba con otra o hazle una captura.")))),
      "image/jpeg",
      CALIDAD
    )
  );
}

// La misma dirección firmada, pero con "download" Supabase la manda como archivo.
// Un <a download> no vale: la foto está en otro dominio y el navegador lo ignora.
export function urlParaBajar(url, concepto) {
  // Una barra en el nombre del archivo lo metería en una carpeta.
  const nombre = `Ticket ${String(concepto ?? "").replace(/[/\\]/g, "-").trim() || "del gasto"}.jpg`;
  return `${url}&download=${encodeURIComponent(nombre)}`;
}

// Un ticket largo en dos fotos, o el ticket y la factura. La primera sigue en
// "ticket", que es la que se lee y la que miran los filtros; las demás van aparte.
export const MAXIMO_FOTOS = 4;

export function fotosDeGasto(gasto) {
  return [gasto?.ticket, ...(gasto?.masTickets ?? [])].filter(Boolean);
}

export function cabeOtraFoto(gasto) {
  const cuantas = fotosDeGasto(gasto).length;
  return cuantas > 0 && cuantas < MAXIMO_FOTOS;
}

// Si se quita la primera, sube la siguiente: el gasto no se queda sin ticket
// teniendo otras fotos.
export function sinLaFoto(gasto, ruta) {
  const quedan = fotosDeGasto(gasto).filter((r) => r !== ruta);
  return { ticket: quedan[0] ?? null, masTickets: quedan.slice(1) };
}
