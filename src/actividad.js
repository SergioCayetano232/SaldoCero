// Lo último que ha pasado en el viaje: quién apuntó, cambió o borró qué.
// Lo escribe la base de datos sola, así que llega lo de todos, no solo lo tuyo.

import { conMoneda } from "./monedas";

// Lo que hacen de golpe (vaciar el viaje, pegar una lista) va en una sola línea.
const JUNTOS_SI_EN = 2 * 60 * 1000;

const VERBOS = {
  gasto_nuevo: ["apuntó", "apuntaste"],
  gasto_cambiado: ["cambió", "cambiaste"],
  gasto_borrado: ["borró", "borraste"],
  viajero_nuevo: ["añadió a", "añadiste a"],
  viajero_quitado: ["quitó a", "quitaste a"],
  pago_saldado: ["dio por pagado", "diste por pagado"],
};

const EN_PLURAL = { gasto_nuevo: "gastos", gasto_borrado: "gastos", viajero_nuevo: "viajeros", viajero_quitado: "viajeros" };

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
  if (fila.que === "pago_saldado") return `lo de ${fila.sobre.replace(" → ", " a ")}`;
  if (fila.importe === null || fila.importe === undefined) return fila.sobre;
  return `${fila.sobre} (${conMoneda(Number(fila.importe), fila.moneda ?? monedaViaje)})`;
}

export function frase(grupo, viajeros, soy, monedaViaje = "EUR") {
  const esYo = Boolean(soy) && grupo.quien === soy;
  const quien = esYo ? "Tú" : viajeros.find((v) => v.id === grupo.quien)?.nombre ?? "Alguien";
  const verbo = VERBOS[grupo.que][esYo ? 1 : 0];
  const que = grupo.filas.length > 1 ? `${grupo.filas.length} ${EN_PLURAL[grupo.que]}` : deQue(grupo.filas[0], monedaViaje);
  return `${quien} ${verbo} ${que}`;
}
