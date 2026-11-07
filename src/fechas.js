// Las fechas de los gastos.

import { t, tn, formatoFechas } from "./idioma";

// "2026-09-11", que es como las guarda la base de datos.
export function hoy() {
  return new Date().toLocaleDateString("sv-SE");
}

export function ayer() {
  return haceDias(1);
}

export function anteayer() {
  return haceDias(2);
}

function haceDias(cuantos) {
  const dia = new Date();
  dia.setDate(dia.getDate() - cuantos);
  return dia.toLocaleDateString("sv-SE");
}

// Casi todo es de hoy o de ayer: para esos no hace falta abrir el calendario.
// Anteayer también, que a la vuelta se apunta lo del sábado el lunes.
export function diasRapidos() {
  return [
    { nombre: t("Hoy"), fecha: hoy() },
    { nombre: t("Ayer"), fecha: ayer() },
    { nombre: t("Anteayer"), fecha: anteayer() },
  ];
}

// Un día suelto, en corto: "vie, 11 sept".
export function enCorto(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString(formatoFechas(), {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Cuándo fue el viaje, sacado de los gastos: "Del 11 al 14 de septiembre de 2026".
// Con el año siempre, que el resumen se guarda y se relee pasado el tiempo.
export function cuandoFue(fechas) {
  const dias = fechas.filter(Boolean).sort();
  if (dias.length === 0) return null;

  const [desde, hasta] = [dias[0], dias.at(-1)].map((f) => {
    const [ano, mes, dia] = f.split("-");
    const nombreMes = new Date(`${f}T12:00:00`).toLocaleDateString(formatoFechas(), { month: "long" });
    return { ano, mes, dia: Number(dia), nombreMes };
  });
  const datos = { dia: desde.dia, mes: desde.nombreMes, ano: desde.ano, dia2: hasta.dia, mes2: hasta.nombreMes, ano2: hasta.ano };

  if (dias[0] === dias.at(-1)) return t("El {dia} de {mes} de {ano}", datos);
  if (desde.ano !== hasta.ano) return t("Del {dia} de {mes} de {ano} al {dia2} de {mes2} de {ano2}", datos);
  if (desde.mes !== hasta.mes) return t("Del {dia} de {mes} al {dia2} de {mes2} de {ano2}", datos);
  return t("Del {dia} al {dia2} de {mes2} de {ano2}", datos);
}

// El título de cada grupo de la lista: "Hoy", "Ayer" o el día entero.
// Si es de otro año, con el año: si no, un gasto del año pasado no se distingue.
export function comoTitulo(fecha) {
  if (fecha === hoy()) return t("Hoy");
  if (fecha === ayer()) return t("Ayer");

  const ano = fecha.slice(0, 4);
  return ano === hoy().slice(0, 4) ? enCorto(fecha) : `${enCorto(fecha)} ${ano}`;
}

// Los gastos por días, del más reciente al más antiguo.
// Los de antes de que hubiera fecha se quedan juntos al final.
export function porDias(gastos) {
  const dias = new Map();

  for (const gasto of gastos) {
    const fecha = gasto.fecha ?? "";
    if (!dias.has(fecha)) dias.set(fecha, []);
    dias.get(fecha).push(gasto);
  }

  return [...dias]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([fecha, suyos]) => ({ fecha, gastos: suyos }));
}

// Lo que lleva cada día, al lado de su título.
export function cuantosGastos(n) {
  return tn(n, "{n} gasto", "{n} gastos");
}

// Cuándo entraste por última vez en un viaje: "hoy", "ayer", "hace 3 días"...
// Cuenta días del calendario, no de 24 horas: lo de anoche ya es "ayer".
export function haceCuanto(momento, ahora = new Date()) {
  if (!Number.isFinite(momento)) return "";

  const aMediodia = (d) => new Date(`${new Date(d).toLocaleDateString("sv-SE")}T12:00:00`);
  const dias = Math.round((aMediodia(ahora) - aMediodia(momento)) / 86400000);

  // Con el reloj del móvil cambiado puede salir del futuro. Se queda en hoy.
  if (dias <= 0) return t("hoy");
  if (dias === 1) return t("ayer");
  if (dias < 7) return t("hace {n} días", { n: dias });
  if (dias < 30) return tn(Math.floor(dias / 7), "hace una semana", "hace {n} semanas");
  if (dias < 365) return tn(Math.floor(dias / 30), "hace un mes", "hace {n} meses");
  return t("hace más de un año");
}

// Cuándo se apuntó un gasto, para ver qué es nuevo: "hace 5 min", "hace 3 h".
// Pasado un día ya no dice nada, que en todos los gastos sería ruido.
export function apuntadoHace(momento, ahora = Date.now()) {
  const minutos = Math.floor((ahora - Date.parse(momento)) / 60000);
  if (!Number.isFinite(minutos)) return null;

  // Con el reloj del móvil adelantado puede salir del futuro.
  if (minutos < 1) return t("ahora mismo");
  if (minutos < 60) return t("hace {n} min", { n: minutos });
  if (minutos < 24 * 60) return t("hace {n} h", { n: Math.floor(minutos / 60) });
  return null;
}
