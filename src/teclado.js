// Con ratón y teclado de verdad. En el móvil, poner el foco en un campo saca el
// teclado y te tapa media pantalla, así que allí no se hace.
export function esOrdenador(ventana = typeof window === "undefined" ? undefined : window) {
  return ventana?.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
}

// La "/" lleva al buscador, como en GitHub o YouTube. Pero no si estás
// escribiendo en otro campo, ni con una ventana abierta encima.
export function esAtajoBuscar(e, hayVentana = false) {
  if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return false;
  if (hayVentana) return false;
  const t = e.target;
  return !(t?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t?.tagName));
}

// Ctrl+Z (Cmd+Z en Mac) recupera lo último que has quitado. Dentro de un campo
// no, que ahí deshace lo que estás escribiendo.
export function esAtajoDeshacer(e) {
  if (e.key?.toLowerCase() !== "z" || !(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return false;
  const t = e.target;
  return !(t?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t?.tagName));
}
