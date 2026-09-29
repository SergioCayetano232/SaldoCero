// El QR del viaje, para entrar apuntando con la cámara.

import QRCode from "qrcode";

// Todos los cuadraditos en un solo path de SVG. Los que van seguidos en una fila
// se juntan en un rectángulo, que si no el path sale enorme.
export function caminoDelQR(tamano, esOscuro) {
  let camino = "";

  for (let y = 0; y < tamano; y++) {
    let x = 0;
    while (x < tamano) {
      if (!esOscuro(x, y)) {
        x++;
        continue;
      }

      const empieza = x;
      while (x < tamano && esOscuro(x, y)) x++;
      const largo = x - empieza;
      camino += `M${empieza} ${y}h${largo}v1h-${largo}z`;
    }
  }

  return camino;
}

// Nivel M: aguanta que se vea un poco mal (una pantalla con reflejos, un móvil
// que tiembla) sin que el QR salga demasiado denso.
export function qrDelEnlace(texto) {
  const { modules } = QRCode.create(texto, { errorCorrectionLevel: "M" });

  return {
    tamano: modules.size,
    camino: caminoDelQR(modules.size, (x, y) => modules.get(y, x)),
  };
}
