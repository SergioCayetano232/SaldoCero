// Las cuentas del viaje, sueltas de la interfaz.

// Por debajo de un céntimo lo damos por cero, son restos de los decimales.
const MARGEN = 0.01;

// Entre quiénes se reparte un gasto.
// Los gastos de antes no traen participantes, esos van entre todos.
export function participantesDeGasto(gasto, viajeros) {
  if (!gasto.participantes) return viajeros;

  return viajeros.filter((viajero) => gasto.participantes.includes(viajero.id));
}

export function calcularTotal(gastos) {
  return gastos.reduce((suma, gasto) => suma + gasto.importe, 0);
}

// Cuánto ha puesto cada uno, cuánto le tocaba y su balance.
// Ya no vale dividir el total entre todos: cada gasto va con su gente, así que
// hay que ir gasto por gasto repartiendo entre los suyos.
export function calcularBalances(viajeros, gastos) {
  const puesto = new Map(viajeros.map((viajero) => [viajero.id, 0]));
  const tocaPagar = new Map(viajeros.map((viajero) => [viajero.id, 0]));

  for (const gasto of gastos) {
    if (puesto.has(gasto.pagadorId)) {
      puesto.set(gasto.pagadorId, puesto.get(gasto.pagadorId) + gasto.importe);
    }

    const participantes = participantesDeGasto(gasto, viajeros);
    if (participantes.length === 0) continue;

    const parte = gasto.importe / participantes.length;
    for (const participante of participantes) {
      tocaPagar.set(participante.id, tocaPagar.get(participante.id) + parte);
    }
  }

  return viajeros.map((viajero) => ({
    ...viajero,
    puesto: puesto.get(viajero.id),
    tocaPagar: tocaPagar.get(viajero.id),
    // Positivo, le deben. Negativo, debe.
    balance: puesto.get(viajero.id) - tocaPagar.get(viajero.id),
  }));
}

// Le toca al que peor balance tiene, o sea al que menos ha puesto.
export function calcularLeTocaPagar(balances) {
  if (balances.length === 0) return null;

  const balanceMin = Math.min(...balances.map((v) => v.balance));
  const balanceMax = Math.max(...balances.map((v) => v.balance));

  // Si nadie destaca, está igualado y paga quien quiera.
  if (balanceMax - balanceMin < MARGEN) return { igualados: true };

  const persona = balances.find((v) => v.balance === balanceMin);
  return { igualados: false, nombre: persona.nombre };
}

// Quién paga a quién para quedar todos a cero.
// Emparejamos al que más debe con al que más se le debe, y así salen los menos
// pagos posibles.
export function calcularPagos(balances) {
  // Copias, que no queremos tocar los balances.
  const deudores = balances
    .filter((v) => v.balance < -MARGEN)
    .map((v) => ({ nombre: v.nombre, cantidad: -v.balance }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const acreedores = balances
    .filter((v) => v.balance > MARGEN)
    .map((v) => ({ nombre: v.nombre, cantidad: v.balance }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const pagos = [];
  let i = 0;
  let j = 0;

  while (i < deudores.length && j < acreedores.length) {
    // Se paga lo menor de las dos cantidades.
    const cantidad = Math.min(deudores[i].cantidad, acreedores[j].cantidad);

    pagos.push({ de: deudores[i].nombre, a: acreedores[j].nombre, cantidad });

    deudores[i].cantidad -= cantidad;
    acreedores[j].cantidad -= cantidad;

    // Al que ya no le queda nada, siguiente.
    if (deudores[i].cantidad < MARGEN) i++;
    if (acreedores[j].cantidad < MARGEN) j++;
  }

  return pagos;
}
