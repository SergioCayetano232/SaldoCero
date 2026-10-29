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

// La "R" sube al formulario el último gasto apuntado, como el ⧉ de su fila.
// Cmd+R o Ctrl+R es recargar, eso no.
export function esAtajoRepetir(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "r" || e.ctrlKey || e.metaKey || e.altKey) return false;
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

// La "X" quita todos los filtros de golpe, como "quitar filtros". Con Ctrl o
// Cmd es cortar, eso no se toca.
export function esAtajoQuitarFiltros(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "x" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "O" pasa al siguiente orden de la lista, como ir bajando por el desplegable.
export function esAtajoOrden(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "o" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// En la entrada, del 1 al 9 abren tus viajes por orden: el 1, el de arriba.
// Devuelve cuál, o -1 si la tecla no es para eso.
export function viajeDeLaTecla(e, cuantos, hayVentana = false) {
  if (!/^[1-9]$/.test(e.key ?? "") || e.ctrlKey || e.metaKey || e.altKey) return -1;
  if (hayVentana || escribiendo(e.target)) return -1;
  const cual = Number(e.key) - 1;
  return cual < cuantos ? cual : -1;
}

// La "Q" te saca del viaje, como la ✕ de arriba. Salir no borra nada, así
// que no se pregunta. Cmd+Q es cerrar el navegador, eso no.
export function esAtajoSalir(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "q" || e.ctrlKey || e.metaKey || e.altKey) return false;
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

// La "A" lleva al campo de añadir viajeros.
export function esAtajoViajero(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "a" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "V" pone las historias del viaje, cuando ya está cerrado.
export function esAtajoHistorias(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "v" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "B" abre el bote para poner dinero.
export function esAtajoBote(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "b" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "G" guarda el resumen en un archivo, como el botón "Guardar".
export function esAtajoBajarResumen(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "g" || e.ctrlKey || e.metaKey || e.altKey) return false;
  return !hayVentana && !escribiendo(e.target);
}

// La "E" baja los gastos en el Excel.
export function esAtajoExcel(e, hayVentana = false) {
  if (e.key?.toLowerCase() !== "e" || e.ctrlKey || e.metaKey || e.altKey) return false;
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

// La "R" vuelve a poner las historias desde el principio, como "Otra vez".
// Con Cmd o Ctrl es recargar la página, eso no se toca.
export function esAtajoOtraVez(e) {
  return e.key?.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey && !e.altKey;
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
    { teclas: ["A"], que: "Añadir un viajero" },
    { teclas: ["N"], que: "Apuntar un gasto nuevo" },
    { teclas: ["R"], que: "Repetir el último gasto apuntado" },
    ...(conDictado ? [{ teclas: ["D"], que: "Dictar un gasto" }] : []),
    { teclas: ["/"], que: "Buscar un gasto" },
    { teclas: ["M"], que: "Ver solo lo tuyo" },
    { teclas: ["H"], que: "Ver solo lo de hoy" },
    { teclas: ["X"], que: "Quitar todos los filtros" },
    { teclas: ["O"], que: "Cambiar el orden de los gastos" },
    { teclas: ["C"], que: "Ir a quién paga a quién" },
    { teclas: ["P"], que: "Poner o cambiar el presupuesto" },
    { teclas: ["B"], que: "Poner dinero en el bote" },
    { teclas: ["S"], que: "Compartir el resumen" },
    { teclas: ["G"], que: "Guardar el resumen en un archivo" },
    { teclas: ["E"], que: "Bajar los gastos en un Excel" },
    { teclas: ["I"], que: "Enseñar el QR para invitar" },
    { teclas: ["V"], que: "Ver el viaje en historias, ya cerrado" },
    { teclas: ["T"], que: "Cambiar el tema" },
    { teclas: ["Q"], que: "Salir del viaje" },
    { teclas: [mac ? "⌘" : "Ctrl", "Enter"], que: "Guardar el gasto desde cualquier campo" },
    { teclas: [mac ? "⌘" : "Ctrl", "Z"], que: "Recuperar lo último que has quitado" },
    { teclas: ["Esc"], que: "Dejar de editar, salir del buscador o cerrar una ventana" },
    { teclas: ["?"], que: "Ver estos atajos" },
  ];
}
