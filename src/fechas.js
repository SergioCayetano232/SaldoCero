// Las fechas de los gastos.

// "2026-09-11", que es como las guarda la base de datos.
export function hoy() {
  return new Date().toLocaleDateString("sv-SE");
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
  const dia = hoy();
  if (fecha === dia) return "Hoy";

  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  if (fecha === ayer.toLocaleDateString("sv-SE")) return "Ayer";

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
