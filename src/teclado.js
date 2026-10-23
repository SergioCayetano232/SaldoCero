// Con ratón y teclado de verdad. En el móvil, poner el foco en un campo saca el
// teclado y te tapa media pantalla, así que allí no se hace.
export function esOrdenador(ventana = typeof window === "undefined" ? undefined : window) {
  return ventana?.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
}

function escribiendo(t) {
  return Boolean(t?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t?.tagName));
}

// La "/" lleva al buscador, como en GitHub o YouTube. Pero no si estás
// escribiendo en otro campo, ni con una ventana abierta encima.
export function esAtajoBuscar(e, hayVentana = false) {
  if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return false;
  if (hayVentana) return false;
  return !escribiendo(e.target);
}

// Ctrl+Z (Cmd+Z en Mac) recupera lo último que has quitado. Dentro de un campo
// no, que ahí deshace lo que estás escribiendo.
export function esAtajoDeshacer(e) {
  if (e.key?.toLowerCase() !== "z" || !(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return false;
  return !escribiendo(e.target);
}

// La "N" lleva a apuntar un gasto nuevo, con las mismas pegas que la "/".
export function esAtajoNuevo(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "n" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// Ctrl+Enter (Cmd+Enter en Mac) guarda el gasto desde cualquier campo, también
// desde los que con Enter solo no guardan, como la fecha o quién pagó.
export function esAtajoGuardar(e) {
  return e.key === "Enter" && Boolean(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey;
}

// La "?" enseña todos estos. Con Mayúsculas, que es como sale la "?".
export function esAtajoAyuda(e, hayVentana = false) {
  if (e.key !== "?" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

export function esMac(navegador = typeof navigator === "undefined" ? undefined : navigator) {
  return /Mac|iPhone|iPad/.test(navegador?.platform || navegador?.userAgent || "");
}

// Lo que sale en la ventana de la "?". En Mac se dice ⌘, que Ctrl allí no es.
export function listaDeAtajos(mac = false) {
  return [
    { teclas: ["N"], que: "Apuntar un gasto nuevo" },
    { teclas: ["/"], que: "Buscar un gasto" },
    { teclas: [mac ? "⌘" : "Ctrl", "Enter"], que: "Guardar el gasto desde cualquier campo" },
    { teclas: [mac ? "⌘" : "Ctrl", "Z"], que: "Recuperar lo último que has quitado" },
    { teclas: ["Esc"], que: "Dejar de editar un gasto o cerrar una ventana" },
    { teclas: ["?"], que: "Ver estos atajos" },
  ];
}
