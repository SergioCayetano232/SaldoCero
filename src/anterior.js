// Comparar con el viaje del que salió este al repetirlo. Al repetir se guarda un
// resumen del viejo, solo cifras: el código no, que abriría el viejo a cualquiera
// que entre en el nuevo.

import { calcularTotal, soloGastos } from "./calculos";
import { t } from "./idioma";

export function resumenDelViaje(nombre, moneda, gastos, viajeros) {
  const deVerdad = soloGastos(gastos);
  if (!deVerdad.length || !viajeros.length) return null;

  return {
    nombre,
    moneda,
    total: Math.round(calcularTotal(gastos) * 100) / 100,
    dias: new Set(deVerdad.map((g) => g.fecha).filter(Boolean)).size,
    personas: viajeros.length,
  };
}

// Viene de la base de datos: si le falta algo, como si no hubiera.
export function limpiarAnterior(anterior) {
  if (!anterior || typeof anterior !== "object") return null;
  const { nombre, moneda, total, dias, personas } = anterior;
  const vale =
    typeof nombre === "string" && typeof moneda === "string" && total > 0 && Number.isInteger(dias) && dias >= 0 && personas > 0;
  return vale ? { nombre, moneda, total, dias, personas } : null;
}

// Por persona y día si se puede: con más gente o más días, el total no dice nada.
// Null si no hay con qué comparar, o si va en otra moneda.
export function frenteAlAnterior(cifras, anterior, moneda) {
  const a = limpiarAnterior(anterior);
  if (!cifras || !a || a.moneda !== moneda) return null;

  const antesPorDia = a.dias > 1 ? a.total / a.personas / a.dias : null;
  const porDia = antesPorDia !== null && cifras.porPersonaYDia !== null;
  const antes = porDia ? antesPorDia : a.total;
  const ahora = porDia ? cifras.porPersonaYDia : cifras.total;

  return { nombre: a.nombre, porDia, antes, ahora, porcentaje: Math.round(((ahora - antes) / antes) * 100) };
}

export function textoFrenteAlAnterior(frente, dinero) {
  const { nombre, porDia, antes, porcentaje } = frente;
  const datos = { nombre, n: Math.abs(porcentaje), cifra: dinero(antes) };
  if (porcentaje === 0) {
    return porDia
      ? t("Igual que en {nombre}, {cifra} por persona y día", datos)
      : t("Lo mismo que en {nombre}, {cifra}", datos);
  }
  if (porDia) {
    return porcentaje > 0
      ? t("Un {n} % más que en {nombre}, que salió a {cifra} por persona y día", datos)
      : t("Un {n} % menos que en {nombre}, que salió a {cifra} por persona y día", datos);
  }
  return porcentaje > 0
    ? t("Un {n} % más que en {nombre}, donde gastasteis {cifra}", datos)
    : t("Un {n} % menos que en {nombre}, donde gastasteis {cifra}", datos);
}
