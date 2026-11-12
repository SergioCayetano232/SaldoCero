// Desde cuándo esperan las deudas. Solo con el viaje cerrado: abierto, cambian
// con cada gasto y no hay un "desde" que sea verdad.

import { haceCuanto } from "./fechas";
import { t } from "./idioma";

// Recién vuelto es normal deber. A los tres días ya se puede decir, y a las dos
// semanas toca dar un toque.
export const DIAS_PARA_DECIRLO = 3;
export const DIAS_PARA_AVISAR = 14;

export function esperaDeLasDeudas(cerradoEn, quedan, ahora = Date.now()) {
  const cierre = Date.parse(cerradoEn ?? "");
  if (!Number.isFinite(cierre) || !(quedan > 0)) return null;

  const dias = Math.floor((ahora - cierre) / 86400000);
  if (dias < DIAS_PARA_DECIRLO) return null;

  return {
    dias,
    texto: t("cerrado {cuando} y sin pagar", { cuando: haceCuanto(cierre, ahora) }),
    avisar: dias >= DIAS_PARA_AVISAR,
  };
}
