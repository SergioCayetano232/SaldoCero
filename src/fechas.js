// Las fechas de los gastos.

// "2026-09-11", que es como las guarda la base de datos.
export function hoy() {
  return new Date().toLocaleDateString("sv-SE");
}

export function ayer() {
  const dia = new Date();
  dia.setDate(dia.getDate() - 1);
  return dia.toLocaleDateString("sv-SE");
}

// Casi todo es de hoy o de ayer: para esos no hace falta abrir el calendario.
export function diasRapidos() {
  return [
    { nombre: "Hoy", fecha: hoy() },
    { nombre: "Ayer", fecha: ayer() },
  ];
}

// Un día suelto, en corto: "vie, 11 sept".
export function enCorto(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// El título de cada grupo de la lista: "Hoy", "Ayer" o el día entero.
export function comoTitulo(fecha) {
  if (fecha === hoy()) return "Hoy";
  if (fecha === ayer()) return "Ayer";

  return enCorto(fecha);
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
  return n === 1 ? "1 gasto" : `${n} gastos`;
}

// Cuándo entraste por última vez en un viaje: "hoy", "ayer", "hace 3 días"...
// Cuenta días del calendario, no de 24 horas: lo de anoche ya es "ayer".
export function haceCuanto(momento, ahora = new Date()) {
  if (!Number.isFinite(momento)) return "";

  const aMediodia = (d) => new Date(`${new Date(d).toLocaleDateString("sv-SE")}T12:00:00`);
  const dias = Math.round((aMediodia(ahora) - aMediodia(momento)) / 86400000);

  // Con el reloj del móvil cambiado puede salir del futuro. Se queda en hoy.
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 30) return Math.floor(dias / 7) === 1 ? "hace una semana" : `hace ${Math.floor(dias / 7)} semanas`;
  if (dias < 365) return Math.floor(dias / 30) === 1 ? "hace un mes" : `hace ${Math.floor(dias / 30)} meses`;
  return "hace más de un año";
}
