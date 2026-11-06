// Los días que está cada uno: el que llega el sábado no paga la cena del viernes.
// Sin desde ni hasta, está todo el viaje, que es como van los de antes.

import { enCorto } from "./fechas";
import { t } from "./idioma";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function fechaOVacia(texto) {
  return typeof texto === "string" && FECHA.test(texto) ? texto : null;
}

export function estaEseDia(viajero, fecha) {
  if (!fecha) return true;
  if (viajero.desde && fecha < viajero.desde) return false;
  if (viajero.hasta && fecha > viajero.hasta) return false;
  return true;
}

// Entre quiénes va un gasto nuevo de ese día. Si no hubiera nadie, todos: que
// no se quede un gasto sin nadie por unas fechas mal puestas.
export function presentesEseDia(viajeros, fecha) {
  const estan = viajeros.filter((v) => estaEseDia(v, fecha));
  return (estan.length ? estan : viajeros).map((v) => v.id);
}

// Los que faltan ese día, para decir por qué no van marcados.
export function ausentesEseDia(viajeros, fecha) {
  if (viajeros.every((v) => !estaEseDia(v, fecha))) return [];
  return viajeros.filter((v) => !estaEseDia(v, fecha));
}

// Del gasto que copias, los que estén el día nuevo. Si no queda ninguno, los de antes.
export function quienesSiguen(participantes, viajeros, fecha) {
  const siguen = participantes.filter((id) => {
    const viajero = viajeros.find((v) => v.id === id);
    return !viajero || estaEseDia(viajero, fecha);
  });
  return siguen.length ? siguen : participantes;
}

// Lo que se guarda. Si las ponen al revés, se dan la vuelta: nadie se va antes de llegar.
export function limpiarEstancia(desde, hasta) {
  const d = fechaOVacia(desde);
  const h = fechaOVacia(hasta);
  if (d && h && d > h) return { desde: h, hasta: d };
  return { desde: d, hasta: h };
}

export function tieneEstancia(viajero) {
  return Boolean(viajero.desde || viajero.hasta);
}

// "del sáb, 12 sept al dom, 13 sept", "desde el sáb, 12 sept"... Null si está todo el viaje.
export function textoEstancia(viajero) {
  const { desde, hasta } = viajero;
  if (desde && hasta) {
    return desde === hasta
      ? t("solo el {dia}", { dia: enCorto(desde) })
      : t("del {desde} al {hasta}", { desde: enCorto(desde), hasta: enCorto(hasta) });
  }
  if (desde) return t("desde el {dia}", { dia: enCorto(desde) });
  if (hasta) return t("hasta el {dia}", { dia: enCorto(hasta) });
  return null;
}
