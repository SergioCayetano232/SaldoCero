// En el ordenador no vibra nada al guardar: el botón lo dice un momento.
export const DURA_EL_AVISO = 2000;

export function textoAlGuardar(hecho) {
  if (hecho === "anadido") return "✓ Apuntado";
  if (hecho === "editado") return "✓ Cambios guardados";
  return "Añadir gasto";
}
