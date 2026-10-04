// Qué decir si al abrir la app no se puede entrar en el viaje.

import { codigoDeTexto } from "./codigos";

// Al arrancar nadie ha escrito nada, así que "míralo otra vez" no pega: hay que
// decir de dónde salía el código.
export function avisoDeArranque(fallo, desdeEnlace) {
  if (!fallo?.noExiste) return fallo?.message ?? "No hemos podido abrir el viaje.";

  return desdeEnlace
    ? "Ese enlace no lleva a ningún viaje. Puede que esté mal copiado: pide que te lo pasen otra vez."
    : "El último viaje en el que estuviste ya no existe.";
}

// Con la app ya abierta también llegan enlaces: si el código es otro, a ese viaje.
// Si es el mismo en el que estás, o el enlace va vacío (al salir), nada.
export function codigoQueAbrir(hash, codigoActual) {
  const codigo = codigoDeTexto(String(hash ?? "").replace(/^#/, ""));
  if (!codigo || codigo === codigoActual) return null;
  return codigo;
}
