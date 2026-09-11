// Las cuentas del viaje, sueltas de la interfaz.

// Por debajo de un céntimo lo damos por cero, son restos de los decimales.
const MARGEN = 0.01;

// Entre quiénes se reparte un gasto.
// Los gastos de antes no traen participantes, esos van entre todos.
export function participantesDeGasto(gasto, viajeros) {
  if (!gasto.participantes) return viajeros;

  return viajeros.filter((viajero) => gasto.participantes.includes(viajero.id));
}

// Lo que cuenta un gasto para las cuentas: siempre en la moneda del viaje.
// Los gastos de antes de las monedas no traen convertido, y esos ya iban en ella.
export function importeDeGasto(gasto) {
  return gasto.importeConvertido ?? gasto.importe;
}

export function calcularTotal(gastos) {
  return gastos.reduce((suma, gasto) => suma + importeDeGasto(gasto), 0);
}

// Cuánto le toca de un gasto a cada uno de los suyos.
//
// Normalmente a partes iguales, pero un gasto puede traer partes: si uno se
// pidió el chuletón y otro una ensalada, no es justo partirlo por la mitad.
// Las partes son un peso, no un importe: {ana: 2, luis: 1} es dos tercios y un
// tercio. Así la cuenta cuadra siempre aunque luego cambies el importe.
export function repartoDeGasto(gasto, participantes) {
  const importe = importeDeGasto(gasto);
  const reparto = new Map();

  if (participantes.length === 0) return reparto;

  const partes = gasto.partes ?? null;
  // Solo valen las partes de los que siguen en el gasto.
  const suma = partes
    ? participantes.reduce((t, p) => t + (partes[p.id] ?? 0), 0)
    : 0;

  // Sin partes, o con partes que no suman nada, a partes iguales.
  if (!partes || suma <= 0) {
    const parte = importe / participantes.length;
    for (const p of participantes) reparto.set(p.id, parte);
    return reparto;
  }

  for (const p of participantes) {
    reparto.set(p.id, (importe * (partes[p.id] ?? 0)) / suma);
  }

  return reparto;
}

// Cuánto ha puesto cada uno, cuánto le tocaba y su balance.
// Ya no vale dividir el total entre todos: cada gasto va con su gente, así que
// hay que ir gasto por gasto repartiendo entre los suyos.
export function calcularBalances(viajeros, gastos) {
  const puesto = new Map(viajeros.map((viajero) => [viajero.id, 0]));
  const tocaPagar = new Map(viajeros.map((viajero) => [viajero.id, 0]));

  for (const gasto of gastos) {
    const importe = importeDeGasto(gasto);

    if (puesto.has(gasto.pagadorId)) {
      puesto.set(gasto.pagadorId, puesto.get(gasto.pagadorId) + importe);
    }

    const participantes = participantesDeGasto(gasto, viajeros);
    if (participantes.length === 0) continue;

    for (const [id, parte] of repartoDeGasto(gasto, participantes)) {
      tocaPagar.set(id, tocaPagar.get(id) + parte);
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

// Marca cuáles de los pagos ya están dados por pagados.
//
// Los pagos no se guardan, se calculan cada vez. Así que si alguien apunta un
// gasto después, las cuentas cambian y lo que marcaste puede ya no cuadrar. En
// ese caso lo dejamos ver igual, pero avisando de que la cifra ha cambiado.
export function marcarSaldados(pagos, saldados = []) {
  return pagos.map((pago) => ({
    ...pago,
    saldado: saldados.some((s) => s.de === pago.de && s.a === pago.a),
  }));
}

// Lo que queda por pagar de verdad.
export function quedaPorPagar(pagos) {
  return pagos.filter((pago) => !pago.saldado).reduce((t, p) => t + p.cantidad, 0);
}
