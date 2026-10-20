// Leer el texto de la foto de un ticket. La librería y el español pesan unos
// megas, así que solo se bajan cuando alguien le da a leer, no al abrir la app.

import { medidaParaLeer } from "./leerTicket";

// En gris, con más contraste y a buen tamaño: con la foto tal cual, la coma
// de "24,40" salía como un 7.
async function prepararFoto(foto) {
  const imagen = await createImageBitmap(foto, { imageOrientation: "from-image" });
  const { ancho, alto } = medidaParaLeer(imagen.width, imagen.height);

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d");
  ctx.filter = "grayscale(1) contrast(1.5)";
  ctx.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close?.();
  return lienzo;
}

export async function leerFoto(foto, alAvanzar) {
  const [{ createWorker }, lista] = await Promise.all([import("tesseract.js"), prepararFoto(foto)]);

  const worker = await createWorker("spa", 1, {
    logger: (m) => m.status === "recognizing text" && alAvanzar?.(m.progress),
  });

  try {
    // Un ticket es una columna de líneas sueltas, no un texto con párrafos.
    await worker.setParameters({ tessedit_pageseg_mode: "6" });
    const { data } = await worker.recognize(lista);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
