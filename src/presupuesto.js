// Cuánto llevamos gastado de lo que queríamos gastar.

import { conMoneda } from "./monedas";

// A partir de aquí la barra avisa de que os estáis acercando.
export const AVISO = 0.8;

// Null si no hay presupuesto puesto.
export function estadoPresupuesto(gastado, presupuesto) {
  if (!(presupuesto > 0)) return null;

  const parte = gastado / presupuesto;
  const queda = presupuesto - gastado;

  return {
    porcentaje: Math.round(parte * 100),
    // La barra no pasa del final aunque os paséis, eso ya lo dice el texto.
    relleno: Math.min(parte, 1),
    queda,
    // Un céntimo de más es redondeo, no pasarse.
    nivel: queda < -0.005 ? "pasado" : parte >= AVISO ? "cerca" : "bien",
  };
}

export function textoPresupuesto(estado, presupuesto, moneda) {
  if (estado.nivel === "pasado") return `Os pasáis ${conMoneda(-estado.queda, moneda)}`;
  return `Quedan ${conMoneda(Math.max(estado.queda, 0), moneda)} de ${conMoneda(presupuesto, moneda)}`;
}
