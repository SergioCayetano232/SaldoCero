// El resumen en una imagen para el grupo: quién paga a quién se entiende de
// un vistazo, sin abrir nada. Aquí lo que va en ella; lo de pintar, aparte.

import { conMoneda } from "./monedas";
import { cuandoFue } from "./fechas";
import { porCabeza } from "./compartir";

// Más de esto no se lee en una foto del móvil. El resto, "y 3 más".
export const MAX_PAGOS = 6;

export function datosDeTarjeta({ nombre, total, personas, pagos, moneda, gastos }) {
  const pendientes = pagos.filter((p) => !p.saldado);
  const visibles = pendientes.slice(0, MAX_PAGOS);
  const cuantos = gastos.length === 1 ? "1 gasto" : `${gastos.length} gastos`;
  const quienes = personas.length === 1 ? "1 viajero" : `${personas.length} viajeros`;

  return {
    nombre,
    cuando: cuandoFue(gastos.map((g) => g.fecha)),
    total: conMoneda(total, moneda),
    detalle: `${cuantos} · ${quienes}${porCabeza(total, personas, moneda)}`,
    pagos: visibles.map((p) => ({ de: p.de, a: p.a, cantidad: conMoneda(p.cantidad, moneda) })),
    masPagos: pendientes.length - visibles.length,
    estado: pagos.length === 0 ? "a-cero" : pendientes.length === 0 ? "pagado" : "pendiente",
  };
}

// Medidas de la imagen, en píxeles. Ancha como una foto de móvil.
export const ANCHO = 1080;
export const ALTO_FILA = 112;
const ALTO_FIJO = 940;

// Cuadrada como poco, que si no en el chat sale como una tira.
export function altoDeTarjeta(datos) {
  const filas = datos.estado === "pendiente" ? datos.pagos.length : 1;
  const mas = datos.masPagos > 0 ? 70 : 0;
  return Math.max(ANCHO, ALTO_FIJO + filas * ALTO_FILA + mas);
}

// Un nombre de viaje larguísimo, con sus puntos suspensivos, que quepa en el ancho.
export function recortar(texto, ancho, medir) {
  if (medir(texto) <= ancho) return texto;

  const letras = Array.from(texto);
  while (letras.length > 1 && medir(`${letras.join("").trimEnd()}…`) > ancho) letras.pop();
  return `${letras.join("").trimEnd()}…`;
}
