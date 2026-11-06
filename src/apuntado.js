// En el ordenador no vibra nada al guardar: el botón lo dice un momento.

import { t } from "./idioma";
export const DURA_EL_AVISO = 2000;

export function textoAlGuardar(hecho) {
  if (hecho === "anadido") return `✓ ${t("Apuntado")}`;
  if (hecho === "editado") return `✓ ${t("Cambios guardados")}`;
  return t("Añadir gasto");
}
