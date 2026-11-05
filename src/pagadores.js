// Un gasto pagado entre varios: la cena de 50 en la que Ana puso 30 y Luis 20.

import { BOTE } from "./bote";
import { enLista } from "./nombres";
import { leerImporte } from "./monedas";

// Los que pusieron algo, de más a menos. Si no lo pagaron entre varios, el de siempre.
export function idsDeQuienPago(gasto) {
  const varios = Object.entries(gasto.pagadores ?? {})
    .filter(([, p]) => p > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  return varios.length > 1 ? varios : [gasto.pagadorId];
}

export function pagoEnElGasto(gasto, viajeroId) {
  return idsDeQuienPago(gasto).includes(viajeroId);
}

// "Ana y Luis", "el bote" o el nombre. Los que ya no están no salen.
export function nombreDeQuienPago(gasto, viajeros) {
  if (gasto.pagadorId === BOTE) return "el bote";
  const nombres = idsDeQuienPago(gasto)
    .map((id) => viajeros.find((v) => v.id === id)?.nombre)
    .filter(Boolean);
  return enLista(nombres);
}

// Lo escrito en el formulario, {ana: "30", luis: "20"}, a lo que se guarda.
// Solo los que pusieron algo; con uno solo no es "entre varios".
export function pagadoresDeLoEscrito(escrito) {
  const pagadores = Object.fromEntries(
    Object.entries(escrito)
      .map(([id, texto]) => [id, leerImporte(texto)])
      .filter(([, cuanto]) => cuanto > 0)
  );
  return Object.keys(pagadores).length > 1 ? pagadores : null;
}

// El que más puso va de pagador "oficial": es el que sale en lo que aún no
// sabe de varios, como el orden por quién pagó.
export function pagadorPrincipal(pagadores) {
  return Object.entries(pagadores).sort((a, b) => b[1] - a[1])[0][0];
}

// Lo que falta o sobra para que lo puesto cuadre con el importe. Cero si cuadra.
export function loQueFaltaPorPagar(escrito, importe) {
  const puesto = Object.values(escrito).reduce((t, texto) => t + (leerImporte(texto) ?? 0), 0);
  const falta = Math.round((importe - puesto) * 100) / 100;
  return Math.abs(falta) < 0.005 ? 0 : falta;
}
