// Cuánto llevamos gastado de lo que queríamos gastar.

import { conMoneda } from "./monedas";
import { calcularTotal } from "./calculos";

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

// Lo que os pasaríais con el gasto que estás apuntando. Solo si es este el que
// os saca: si ya ibais pasados, eso ya lo dice la barra. null si no.
export function teSacaDelPresupuesto(gastado, importe, presupuesto) {
  if (!(presupuesto > 0) || !(importe > 0)) return null;
  if (presupuesto - gastado < -0.005) return null;

  const pasado = gastado + importe - presupuesto;
  return pasado > 0.005 ? pasado : null;
}

// La media por día, del primer gasto al último. No sabemos cuándo acaba el
// viaje, así que solo contamos los días que ya tienen algo apuntado en medio.
export function ritmoDeGasto(gastos) {
  const fechas = gastos.map((g) => g.fecha).filter(Boolean).sort();
  if (fechas.length === 0) return null;

  // En UTC, que con el cambio de hora un día puede durar 23 horas.
  const desde = Date.parse(fechas[0]);
  const hasta = Date.parse(fechas[fechas.length - 1]);
  const dias = Math.round((hasta - desde) / 86400000) + 1;

  return { dias, porDia: calcularTotal(gastos) / dias };
}

// Lo que sale cada uno al día, para comparar viajes o avisar al que viene el
// año que viene. Con un día o una persona sola ya lo dice el total.
export function porCabezaYDia(gastos, cuantos) {
  const ritmo = ritmoDeGasto(gastos);
  if (!ritmo || ritmo.dias < 2 || cuantos < 2) return null;
  return ritmo.porDia / cuantos;
}

// "45.00 € al día · os llega para 6 días más". Cerrado o pasados, solo la media.
export function textoRitmo(ritmo, estado, moneda, cerrado = false) {
  const media = `${conMoneda(ritmo.porDia, moneda)} al día`;
  if (cerrado || !estado || estado.nivel === "pasado" || !(ritmo.porDia > 0)) return media;

  const mas = Math.floor(estado.queda / ritmo.porDia);
  if (mas === 0) return `${media} · no os llega para otro día`;
  return `${media} · os llega para ${mas} ${mas === 1 ? "día" : "días"} más`;
}
