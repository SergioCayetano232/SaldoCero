// Lo último que ha pasado en el viaje: quién apuntó, cambió o borró qué.
// Lo escribe la base de datos sola, así que llega lo de todos, no solo lo tuyo.

import { conMoneda } from "./monedas";
import { t } from "./idioma";

// Lo que hacen de golpe (vaciar el viaje, pegar una lista) va en una sola línea.
const JUNTOS_SI_EN = 2 * 60 * 1000;

// La frase entera y no solo el verbo, que en inglés el orden es otro.
const VERBOS = {
  gasto_nuevo: ["{quien} apuntó {que}", "Tú apuntaste {que}"],
  gasto_cambiado: ["{quien} cambió {que}", "Tú cambiaste {que}"],
  gasto_borrado: ["{quien} borró {que}", "Tú borraste {que}"],
  viajero_nuevo: ["{quien} añadió a {que}", "Tú añadiste a {que}"],
  viajero_quitado: ["{quien} quitó a {que}", "Tú quitaste a {que}"],
  pago_saldado: ["{quien} dio por pagado {que}", "Tú diste por pagado {que}"],
};

const EN_PLURAL = {
  gasto_nuevo: "{n} gastos",
  gasto_borrado: "{n} gastos",
  viajero_nuevo: "{n} viajeros",
  viajero_quitado: "{n} viajeros",
};

// Las que no conocemos (de una versión más nueva) no se enseñan.
export function filasQueSeEntienden(filas) {
  return filas.filter((f) => VERBOS[f.que]);
}

// Seguidas, del mismo, haciendo lo mismo y casi a la vez: una sola.
export function agrupar(filas) {
  const grupos = [];
  for (const fila of filasQueSeEntienden(filas)) {
    const ultimo = grupos.at(-1);
    const seJuntan =
      ultimo &&
      EN_PLURAL[fila.que] &&
      ultimo.que === fila.que &&
      ultimo.quien === fila.quien &&
      Math.abs(new Date(ultimo.ultimaEn) - new Date(fila.creadoEn)) <= JUNTOS_SI_EN;

    if (seJuntan) {
      ultimo.filas.push(fila);
      ultimo.ultimaEn = fila.creadoEn;
    } else {
      grupos.push({ id: fila.id, que: fila.que, quien: fila.quien, creadoEn: fila.creadoEn, ultimaEn: fila.creadoEn, filas: [fila] });
    }
  }
  return grupos;
}

function deQue(fila, monedaViaje) {
  // La base de datos lo guarda como "Luis → Ana"; dicho, se entiende mejor así.
  if (fila.que === "pago_saldado") {
    const [de, a] = fila.sobre.split(" → ");
    return t("lo de {de} a {a}", { de, a });
  }
  if (fila.importe === null || fila.importe === undefined) return fila.sobre;
  return `${fila.sobre} (${conMoneda(Number(fila.importe), fila.moneda ?? monedaViaje)})`;
}

export function frase(grupo, viajeros, soy, monedaViaje = "EUR") {
  const esYo = Boolean(soy) && grupo.quien === soy;
  const quien = viajeros.find((v) => v.id === grupo.quien)?.nombre ?? t("Alguien");
  const que = grupo.filas.length > 1 ? t(EN_PLURAL[grupo.que], { n: grupo.filas.length }) : deQue(grupo.filas[0], monedaViaje);
  return t(VERBOS[grupo.que][esYo ? 1 : 0], { quien, que });
}
