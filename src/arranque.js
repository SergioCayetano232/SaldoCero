// Qué decir si al abrir la app no se puede entrar en el viaje.

// Al arrancar nadie ha escrito nada, así que "míralo otra vez" no pega: hay que
// decir de dónde salía el código.
export function avisoDeArranque(fallo, desdeEnlace) {
  if (!fallo?.noExiste) return fallo?.message ?? "No hemos podido abrir el viaje.";

  return desdeEnlace
    ? "Ese enlace no lleva a ningún viaje. Puede que esté mal copiado: pide que te lo pasen otra vez."
    : "El último viaje en el que estuviste ya no existe.";
}
