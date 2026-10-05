// En qué día del viaje estáis, o cuánto duró. Sale de las fechas de los gastos:
// el viaje no tiene fecha de inicio ni de fin.

// Si el último gasto es de hace más, el viaje ya acabó aunque nadie lo cerrase.
// Un "Día 40" no le dice nada a nadie.
const DIAS_SIN_GASTOS = 2;

// En UTC, que con la hora local el cambio de horario se come o regala una hora.
function diasEntre(desde, hasta) {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86400000);
}

function enDias(n) {
  return n === 1 ? "1 día" : `${n} días`;
}

// null si no hay ningún gasto con fecha.
export function textoDuracion(gastos, hoy, cerrado = false) {
  const fechas = gastos.map((g) => g.fecha).filter(Boolean).sort();
  if (fechas.length === 0) return null;

  const primero = fechas[0];
  const ultimo = fechas.at(-1);
  const terminado = cerrado || diasEntre(ultimo, hoy) > DIAS_SIN_GASTOS;

  if (terminado) return enDias(diasEntre(primero, ultimo) + 1);
  return `Día ${Math.max(diasEntre(primero, hoy) + 1, 1)}`;
}
