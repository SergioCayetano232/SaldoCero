// La foto del ticket de un gasto.

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
    throw new Error("No hemos podido leer la foto. Prueba con otra o hazle una captura.");
  }
  const { ancho, alto } = medidaReducida(imagen.width, imagen.height);

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  lienzo.getContext("2d").drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  return new Promise((resolver, fallar) =>
    lienzo.toBlob(
      (blob) => (blob ? resolver(blob) : fallar(new Error("No hemos podido leer la foto. Prueba con otra o hazle una captura."))),
      "image/jpeg",
      CALIDAD
    )
  );
}
