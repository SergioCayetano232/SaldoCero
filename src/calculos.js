// Las cuentas del viaje, sueltas de la interfaz.

import { juntarBalances } from "./juntos";

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

// Una devolución es un gasto en negativo: la fianza que os devuelven, lo que
// os reembolsa la aerolínea... Así las cuentas salen solas.
export function esDevolucion(gasto) {
  return importeDeGasto(gasto) < 0;
}

export function soloGastos(gastos) {
  return gastos.filter((g) => !esDevolucion(g));
}

export function calcularTotal(gastos) {
  return gastos.reduce((suma, gasto) => suma + importeDeGasto(gasto), 0);
}

// Lo que sale cada gasto de media. Con uno solo no hay media que dar.
// Las devoluciones no cuentan, que no son gastos.
export function mediaPorGasto(todos) {
  const gastos = soloGastos(todos);
  if (gastos.length < 2) return null;
  return Math.round((calcularTotal(gastos) / gastos.length) * 100) / 100;
}

// El gasto más gordo del viaje. Con uno solo no tiene gracia: es ese.
// Si empatan, el primero que se apuntó.
export function gastoMasCaro(gastos) {
  if (gastos.length < 2) return null;
  return gastos.reduce((max, g) => (importeDeGasto(g) > importeDeGasto(max) ? g : max));
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

// Lo que puso cada uno de un gasto, en la moneda del viaje. Si lo pagaron entre
// varios, lo de cada uno son pesos, como las partes del reparto: así cuadra
// siempre con el importe. Si de esos ya no queda nadie, vale el pagador de siempre.
export function loQuePuso(gasto, viajeros) {
  const importe = importeDeGasto(gasto);
  const pesos = Object.entries(gasto.pagadores ?? {}).filter(
    ([id, p]) => p > 0 && viajeros.some((v) => v.id === id)
  );
  const suma = pesos.reduce((t, [, p]) => t + p, 0);
  if (pesos.length < 2 || suma <= 0) return new Map([[gasto.pagadorId, importe]]);
  return new Map(pesos.map(([id, p]) => [id, (importe * p) / suma]));
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
    for (const [id, cuanto] of loQuePuso(gasto, viajeros)) {
      if (puesto.has(id)) puesto.set(id, puesto.get(id) + cuanto);
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

// Primero a quien le deben, luego los que están en paz y al final los que deben.
// Por céntimos, que dos en paz con restos de decimales no se crucen; en empate,
// como estaban.
export function ordenarPorSaldo(balances) {
  return [...balances].sort((a, b) => Math.round(b.balance * 100) - Math.round(a.balance * 100));
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
    .map((v) => ({ id: v.id, nombre: v.nombre, ids: v.ids, cantidad: -v.balance }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const acreedores = balances
    .filter((v) => v.balance > MARGEN)
    .map((v) => ({ id: v.id, nombre: v.nombre, ids: v.ids, cantidad: v.balance }))
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
      // Solo si es un grupo: así sabe cada uno de los dos que el pago es suyo.
      ...(deudores[i].ids && { deIds: deudores[i].ids }),
      ...(acreedores[j].ids && { aIds: acreedores[j].ids }),
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

// Todo a través de uno: los que deben le pagan a él, y él paga a los que se les
// debe. Salen más pagos que con calcularPagos, pero cada uno solo trata con él.
export function pagosPorUno(balances, centroId) {
  // Si va en pareja, el centro es la pareja entera.
  const centro = balances.find((v) => v.id === centroId || v.ids?.includes(centroId));
  if (!centro) return calcularPagos(balances);

  const pago = (de, a, cantidad) => ({
    de: de.nombre,
    a: a.nombre,
    deId: de.id,
    aId: a.id,
    ...(de.ids && { deIds: de.ids }),
    ...(a.ids && { aIds: a.ids }),
    cantidad,
  });
  const otros = balances.filter((v) => v !== centro);

  return [
    // Primero lo que le llega, que así no tiene que adelantar nada.
    ...otros.filter((v) => v.balance < -MARGEN).sort((x, y) => x.balance - y.balance).map((v) => pago(v, centro, -v.balance)),
    ...otros.filter((v) => v.balance > MARGEN).sort((x, y) => y.balance - x.balance).map((v) => pago(centro, v, v.balance)),
  ];
}

// Los pagos sin redondear, por el camino corto o a través de uno.
export function pagosExactos(balances, centroId = null) {
  const juntos = juntarBalances(balances);
  return centroId ? pagosPorUno(juntos, centroId) : calcularPagos(juntos);
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
// Los marcados antes de confirmar no traen el campo: esos van como confirmados.
export function marcarSaldados(pagos, saldados = []) {
  return pagos.map((pago) => {
    const marcado = saldados.find((s) => mismoPago(s, pago));
    return { ...pago, saldado: Boolean(marcado), porConfirmar: marcado?.confirmado === false };
  });
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
  const exactos = pagosExactos(balances, viaje?.centro);
  return marcarSaldados(viaje?.redondear ? redondearPagos(exactos) : exactos, viaje?.saldados ?? []);
}

// Lo que queda por pagar de verdad.
export function quedaPorPagar(pagos) {
  return pagos.filter((pago) => !pago.saldado).reduce((t, p) => t + p.cantidad, 0);
}
