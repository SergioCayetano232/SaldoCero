// El confeti de cuando quedáis todos a cero.

import { CATEGORIAS } from "./categorias";
import { mismoPago } from "./calculos";

// Los colores de las categorías, que ya pegan con la app.
export const COLORES = CATEGORIAS.map((c) => c.color);

export const CUANTOS = 90;

// Si al marcar este pago ya no queda ninguno pendiente, toca fiesta.
export function esElUltimo(pagos, pago) {
  const pendientes = pagos.filter((p) => !p.saldado);
  return pendientes.length === 1 && mismoPago(pendientes[0], pago);
}

function entre(min, max, azar) {
  return min + (max - min) * azar();
}

// Cada trozo con su sitio, su color y su forma de caer.
// El azar se puede pasar de fuera, que si no no hay forma de probarlo.
export function trozosDeConfeti(cuantos = CUANTOS, azar = Math.random) {
  return Array.from({ length: cuantos }, (_, i) => ({
    id: i,
    x: entre(0, 100, azar),
    color: COLORES[Math.floor(azar() * COLORES.length)],
    ancho: entre(6, 11, azar),
    redondo: azar() < 0.3,
    // Los primeros salen antes, así no cae todo de golpe como un bloque.
    retraso: entre(0, 0.35, azar),
    duracion: entre(1.8, 3, azar),
    deriva: entre(-80, 80, azar),
    giro: entre(360, 1080, azar) * (azar() < 0.5 ? -1 : 1),
  }));
}
