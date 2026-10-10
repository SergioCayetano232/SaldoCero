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

// Lo que sale cada gasto de media. Con uno solo no hay media que dar.
export function mediaPorGasto(gastos) {
  if (gastos.length < 2) return null;
  return Math.round((calcularTotal(gastos) / gastos.length) * 100) / 100;
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

// Lo que le toca a uno de un gasto. Cero si no va en él.
export function parteDe(gasto, viajeroId, viajeros) {
  return repartoDeGasto(gasto, participantesDeGasto(gasto, viajeros)).get(viajeroId) ?? 0;
}

// Cuánto ha puesto cada uno, cuánto le tocaba y su balance.
// Ya no vale dividir el total entre todos: cada gasto va con su gente, así que
// hay que ir gasto por gasto repartiendo entre los suyos.
//
// Los pagos a cuenta van aparte de "puesto": si Luis le da 20 € a Ana, debe 20 €
// menos, pero no se ha gastado 20 € más en el viaje.
export function calcularBalances(viajeros, gastos, parciales = []) {
  const puesto = new Map(viajeros.map((viajero) => [viajero.id, 0]));
  const tocaPagar = new Map(viajeros.map((viajero) => [viajero.id, 0]));
  const dado = new Map(viajeros.map((viajero) => [viajero.id, 0]));
  const recibido = new Map(viajeros.map((viajero) => [viajero.id, 0]));

  for (const p of parciales) {
    // Si falta alguno de los dos, no se cuenta: descuadraría al otro.
    if (!dado.has(p.deId) || !recibido.has(p.aId)) continue;
    dado.set(p.deId, dado.get(p.deId) + p.importe);
    recibido.set(p.aId, recibido.get(p.aId) + p.importe);
  }

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
    dado: dado.get(viajero.id),
    recibido: recibido.get(viajero.id),
    // Positivo, le deben. Negativo, debe.
    balance:
      puesto.get(viajero.id) -
      tocaPagar.get(viajero.id) +
      dado.get(viajero.id) -
      recibido.get(viajero.id),
  }));
}

// Cómo está cada uno. Con restos de decimales, un -0.004 es estar en paz.
export function estadoDeBalance(balance) {
  if (balance > MARGEN) return "le-deben";
  if (balance < -MARGEN) return "debe";
  return "en-paz";
}

// Le toca al que peor balance tiene, o sea al que menos ha puesto.
export function calcularLeTocaPagar(balances) {
  if (balances.length === 0) return null;

  const balanceMin = Math.min(...balances.map((v) => v.balance));
  const balanceMax = Math.max(...balances.map((v) => v.balance));

  // Si nadie destaca, está igualado y paga quien quiera.
  if (balanceMax - balanceMin < MARGEN) return { igualados: true };

  const persona = balances.find((v) => v.balance === balanceMin);
  return { igualados: false, id: persona.id, nombre: persona.nombre };
}

// Quién paga a quién para quedar todos a cero.
// Emparejamos al que más debe con al que más se le debe, y así salen los menos
// pagos posibles.
export function calcularPagos(balances) {
  // Copias, que no queremos tocar los balances.
  const deudores = balances
    .filter((v) => v.balance < -MARGEN)
    .map((v) => ({ id: v.id, nombre: v.nombre, cantidad: -v.balance }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const acreedores = balances
    .filter((v) => v.balance > MARGEN)
    .map((v) => ({ id: v.id, nombre: v.nombre, cantidad: v.balance }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const pagos = [];
  let i = 0;
  let j = 0;

  while (i < deudores.length && j < acreedores.length) {
    // Se paga lo menor de las dos cantidades.
    const cantidad = Math.min(deudores[i].cantidad, acreedores[j].cantidad);

    pagos.push({
      de: deudores[i].nombre,
      a: acreedores[j].nombre,
      deId: deudores[i].id,
      aId: acreedores[j].id,
      cantidad,
    });

    deudores[i].cantidad -= cantidad;
    acreedores[j].cantidad -= cantidad;

    // Al que ya no le queda nada, siguiente.
    if (deudores[i].cantidad < MARGEN) i++;
    if (acreedores[j].cantidad < MARGEN) j++;
  }

  return pagos;
}

// Los pagos sin céntimos, que nadie hace un Bizum de 23,47 €. Lo que se queda
// en nada, como unos 0,40 €, se perdona y no sale.
export function redondearPagos(pagos) {
  return pagos
    .map((pago) => ({ ...pago, cantidad: Math.round(pago.cantidad) }))
    .filter((pago) => pago.cantidad > 0);
}

// Si hay algo que redondear. Si ya va todo en euros justos, el interruptor sobra.
export function hayCentimos(pagos) {
  return pagos.some((pago) => Math.abs(pago.cantidad - Math.round(pago.cantidad)) >= MARGEN);
}

// Si dos pagos son el mismo quién a quién. Por id, que dos pueden llamarse
// igual; por nombre solo si a alguno le falta, que son los marcados antes.
export function mismoPago(x, y) {
  if (x.deId && x.aId && y.deId && y.aId) return x.deId === y.deId && x.aId === y.aId;
  return x.de === y.de && x.a === y.a;
}

// Marca cuáles de los pagos ya están dados por pagados.
//
// Los pagos no se guardan, se calculan cada vez. Así que si alguien apunta un
// gasto después, las cuentas cambian y lo que marcaste puede ya no cuadrar. En
// ese caso lo dejamos ver igual, pero avisando de que la cifra ha cambiado.
export function marcarSaldados(pagos, saldados = []) {
  return pagos.map((pago) => ({
    ...pago,
    saldado: saldados.some((s) => mismoPago(s, pago)),
  }));
}

// Los balances contando lo que ya se ha pagado.
// Si Luis ya le dio sus 30 € a Ana, en la práctica ha puesto 30 € más y Ana 30 € menos.
export function balancesTrasPagos(balances, pagos) {
  const ajuste = new Map();

  for (const pago of pagos.filter((p) => p.saldado)) {
    const de = pago.deId ?? pago.de;
    const a = pago.aId ?? pago.a;
    ajuste.set(de, (ajuste.get(de) ?? 0) + pago.cantidad);
    ajuste.set(a, (ajuste.get(a) ?? 0) - pago.cantidad);
  }

  return balances.map((v) => ({
    ...v,
    balance: v.balance + (ajuste.get(v.id) ?? ajuste.get(v.nombre) ?? 0),
  }));
}

// Los pagos tal y como salen en el resumen: sin céntimos si así lo quiere el
// viaje y con lo que ya se ha marcado como pagado.
export function pagosDelViaje(balances, viaje) {
  const exactos = calcularPagos(balances);
  return marcarSaldados(viaje?.redondear ? redondearPagos(exactos) : exactos, viaje?.saldados ?? []);
}

// Lo que queda por pagar de verdad.
export function quedaPorPagar(pagos) {
  return pagos.filter((pago) => !pago.saldado).reduce((t, p) => t + p.cantidad, 0);
}
