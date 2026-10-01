// Un viaje cerrado ya no cambia: solo se pagan las deudas.

import { enCorto } from "./fechas";

// Los viajes de antes no traen cerradoEn: abiertos.
export function estaCerrado(viaje) {
  return Boolean(viaje?.cerradoEn);
}

// "Cerrado el vie, 11 sept", con el día de este móvil, que es quien lo lee.
export function textoCerrado(cerradoEn) {
  return `Cerrado el ${enCorto(new Date(cerradoEn).toLocaleDateString("sv-SE"))}`;
}
