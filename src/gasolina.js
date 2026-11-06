// Lo que sale la gasolina de un trayecto: km, lo que gasta el coche y el litro.

import { leerCantidad } from "./monedas";

// Lo del coche y el litro no cambia de un día a otro: se queda en el móvil.
const CLAVE = "saldocero-gasolina";

// Null si falta algo o no se entiende.
export function costeGasolina({ km, consumo, precio, idaYVuelta = false }) {
  const distancia = leerCantidad(km);
  const litrosA100 = leerCantidad(consumo);
  const litro = leerCantidad(precio);
  if (!distancia || !litrosA100 || !litro) return null;

  const total = ((distancia * (idaYVuelta ? 2 : 1)) / 100) * litrosA100 * litro;
  const redondo = Math.round(total * 100) / 100;
  return redondo > 0 ? redondo : null;
}

// Para el campo del importe, con coma: 28,8 y no 28.8.
export function comoImporte(n) {
  return String(n).replace(".", ",");
}

export function cocheGuardado(almacen = globalThis.localStorage) {
  try {
    const guardado = JSON.parse(almacen?.getItem(CLAVE) ?? "{}");
    return {
      consumo: typeof guardado.consumo === "string" ? guardado.consumo : "",
      precio: typeof guardado.precio === "string" ? guardado.precio : "",
    };
  } catch {
    return { consumo: "", precio: "" };
  }
}

export function guardarCoche({ consumo, precio }, almacen = globalThis.localStorage) {
  try {
    almacen?.setItem(CLAVE, JSON.stringify({ consumo, precio }));
  } catch {
    // En privado puede no dejar. Pues la próxima vez se escribe otra vez.
  }
}
