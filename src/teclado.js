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

// La "D" empieza a dictar un gasto, y si ya estás dictando, lo para.
export function esAtajoDictar(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "d" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "M" pone o quita "Solo lo mío".
export function esAtajoLoMio(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "m" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "H" pone o quita "Hoy".
export function esAtajoHoy(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "h" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "P" abre el presupuesto para ponerlo o cambiarlo.
export function esAtajoPresupuesto(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "p" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "S" comparte el resumen, como el botón de arriba.
export function esAtajoCompartir(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "s" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "C" baja a quién paga a quién, como el atajo del icono en el móvil.
export function esAtajoCuentas(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "c" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "T" cambia el tema, igual que el botón del pie: automático, claro, oscuro.
export function esAtajoTema(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "t" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "I" saca el QR para invitar: en el ordenador, lo cómodo es que lo escaneen.
export function esAtajoInvitar(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "i" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// Ctrl+Enter (Cmd+Enter en Mac) guarda el gasto desde cualquier campo, también
// desde los que con Enter solo no guardan, como la fecha o quién pagó.
export function esAtajoGuardar(e) {
  return e.key === "Enter" && Boolean(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey;
}

// El espacio para y sigue las historias, como mantener pulsado con el dedo.
export function esAtajoParar(e) {
  return e.key === " " && !e.ctrlKey && !e.metaKey && !e.altKey;
}

// Escape en el buscador: si hay algo escrito lo vacía, y si ya está vacío te
// saca de él, que si no los atajos no responden hasta que haces clic fuera.
export function escapeEnBuscador(texto) {
  return texto ? "vaciar" : "salir";
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
// La D, solo si el navegador sabe dictar: Firefox no.
export function listaDeAtajos(mac = false, conDictado = false) {
  return [
    { teclas: ["N"], que: "Apuntar un gasto nuevo" },
    ...(conDictado ? [{ teclas: ["D"], que: "Dictar un gasto" }] : []),
    { teclas: ["/"], que: "Buscar un gasto" },
    { teclas: ["M"], que: "Ver solo lo tuyo" },
    { teclas: ["H"], que: "Ver solo lo de hoy" },
    { teclas: ["C"], que: "Ir a quién paga a quién" },
    { teclas: ["P"], que: "Poner o cambiar el presupuesto" },
    { teclas: ["S"], que: "Compartir el resumen" },
    { teclas: ["I"], que: "Enseñar el QR para invitar" },
    { teclas: ["T"], que: "Cambiar el tema" },
    { teclas: [mac ? "⌘" : "Ctrl", "Enter"], que: "Guardar el gasto desde cualquier campo" },
    { teclas: [mac ? "⌘" : "Ctrl", "Z"], que: "Recuperar lo último que has quitado" },
    { teclas: ["Esc"], que: "Dejar de editar, salir del buscador o cerrar una ventana" },
    { teclas: ["?"], que: "Ver estos atajos" },
  ];
}
