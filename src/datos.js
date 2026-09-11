// Todo lo que habla con Supabase vive aquí.
// Hacia fuera devuelve viajes con la misma forma de siempre:
// { id, codigo, nombre, viajeros: [], gastos: [] }

import { supabase, usarCodigo } from "./supabase";

// Al usuario le decimos algo que entienda, pero el fallo de verdad lo dejamos
// en la consola, que si no no hay quien averigüe qué ha pasado.
function fallo(error, mensaje) {
  console.error(mensaje, error);
  return new Error(mensaje);
}

// El código del último viaje, para reabrirlo al volver a entrar.
const CLAVE_ULTIMO = "saldocero-ultimo-codigo";
// Y los viajes por los que has pasado, para no ir buscando códigos por el chat.
const CLAVE_HISTORICO = "saldocero-historico";
const CUANTOS_GUARDAMOS = 8;

export function recordarCodigo(codigo) {
  localStorage.setItem(CLAVE_ULTIMO, codigo);
}

export function codigoRecordado() {
  return localStorage.getItem(CLAVE_ULTIMO) ?? "";
}

export function olvidarCodigo() {
  localStorage.removeItem(CLAVE_ULTIMO);
}

// Los viajes en los que has estado, el último primero.
export function historial() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_HISTORICO) ?? "[]");
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    // Si alguien lo ha tocado a mano y no es JSON, empezamos de cero.
    return [];
  }
}

// Lo apuntamos al entrar. Si ya estaba, sube al principio con su nombre nuevo.
function apuntarEnHistorial(viaje) {
  const resto = historial().filter((v) => v.codigo !== viaje.codigo);
  const lista = [{ codigo: viaje.codigo, nombre: viaje.nombre }, ...resto];

  localStorage.setItem(CLAVE_HISTORICO, JSON.stringify(lista.slice(0, CUANTOS_GUARDAMOS)));
}

export function olvidarDelHistorial(codigo) {
  const lista = historial().filter((v) => v.codigo !== codigo);
  localStorage.setItem(CLAVE_HISTORICO, JSON.stringify(lista));
}

export async function crearViaje(nombre, moneda = "EUR") {
  const { data, error } = await supabase.rpc("crear_viaje", {
    nombre_viaje: nombre,
    moneda_viaje: moneda,
  });
  if (error) throw fallo(error, "No hemos podido crear el viaje.");

  const viaje = data[0];
  usarCodigo(viaje.codigo);
  recordarCodigo(viaje.codigo);
  apuntarEnHistorial(viaje);

  return { ...viaje, viajeros: [], gastos: [] };
}

// Entrar a un viaje con su código y traerse todo lo suyo.
export async function abrirViaje(codigo) {
  const limpio = codigo.trim().toUpperCase();
  if (limpio === "") throw new Error("Escribe el código del viaje.");

  const { data, error } = await supabase.rpc("abrir_viaje", { codigo_buscado: limpio });
  if (error) throw fallo(error, "No hemos podido conectar. Revisa tu conexión.");
  if (!data.length) throw new Error("Ese código no existe. Míralo otra vez.");

  const viaje = data[0];
  // A partir de aquí, todas las peticiones van con este código.
  usarCodigo(viaje.codigo);
  recordarCodigo(viaje.codigo);
  apuntarEnHistorial(viaje);

  return { ...viaje, ...(await cargarContenido(viaje.id)) };
}

// Los viajeros y los gastos de un viaje ya abierto.
async function cargarContenido(viajeId) {
  const [viajeros, gastos, participantes, saldados] = await Promise.all([
    supabase.from("viajeros").select("id, nombre").eq("viaje_id", viajeId).order("creado_en"),
    supabase
      .from("gastos")
      .select("id, pagador_id, importe, moneda, importe_convertido, concepto, categoria")
      .eq("viaje_id", viajeId)
      .order("creado_en"),
    supabase
      .from("gastos_participantes")
      .select("gasto_id, viajero_id, gastos!inner(viaje_id)")
      .eq("gastos.viaje_id", viajeId),
    supabase
      .from("pagos_saldados")
      .select("de_nombre, a_nombre")
      .eq("viaje_id", viajeId),
  ]);

  const error = viajeros.error || gastos.error || participantes.error || saldados.error;
  if (error) throw fallo(error, "No hemos podido cargar el viaje.");

  return {
    viajeros: viajeros.data,
    saldados: saldados.data.map((p) => ({ de: p.de_nombre, a: p.a_nombre })),
    gastos: gastos.data.map((gasto) => ({
      id: gasto.id,
      pagadorId: gasto.pagador_id,
      // En la base de datos es numeric, y llega como texto.
      importe: Number(gasto.importe),
      moneda: gasto.moneda ?? "EUR",
      // Con este echamos las cuentas: ya está en la moneda del viaje.
      importeConvertido: Number(gasto.importe_convertido ?? gasto.importe),
      concepto: gasto.concepto,
      categoria: gasto.categoria ?? "otros",
      participantes: participantes.data
        .filter((p) => p.gasto_id === gasto.id)
        .map((p) => p.viajero_id),
    })),
  };
}

// Volver a leer el viaje entero, para ver lo que hayan tocado los demás.
export async function refrescarViaje(viaje) {
  return { ...viaje, ...(await cargarContenido(viaje.id)) };
}

export async function anadirViajero(viajeId, nombre) {
  const { data, error } = await supabase
    .from("viajeros")
    .insert({ viaje_id: viajeId, nombre })
    .select("id, nombre")
    .single();

  if (error) throw fallo(error, "No hemos podido añadir al viajero.");
  return data;
}

export async function quitarViajero(id) {
  // Los gastos que pagó y los repartos en los que estaba se van con él,
  // de eso se encarga la base de datos (on delete cascade).
  const { error } = await supabase.from("viajeros").delete().eq("id", id);
  if (error) throw fallo(error, "No hemos podido quitar al viajero.");
}

export async function anadirGasto(viajeId, gasto) {
  const { data, error } = await supabase
    .from("gastos")
    .insert({
      viaje_id: viajeId,
      pagador_id: gasto.pagadorId,
      importe: gasto.importe,
      moneda: gasto.moneda,
      importe_convertido: gasto.importeConvertido,
      concepto: gasto.concepto,
      categoria: gasto.categoria,
    })
    .select("id")
    .single();

  if (error) throw fallo(error, "No hemos podido añadir el gasto.");

  // Y con quién se reparte.
  const { error: errorParticipantes } = await supabase.from("gastos_participantes").insert(
    gasto.participantes.map((viajeroId) => ({ gasto_id: data.id, viajero_id: viajeroId }))
  );

  if (errorParticipantes) {
    // Si el reparto falla, el gasto se quedaría suelto y descuadraría las
    // cuentas. Mejor deshacerlo y que el usuario lo vuelva a meter.
    await supabase.from("gastos").delete().eq("id", data.id);
    throw fallo(errorParticipantes, "No hemos podido añadir el gasto.");
  }

  return { ...gasto, id: data.id };
}

// Cambiar un gasto ya apuntado.
// El reparto lo rehacemos entero, que es más fácil que ir mirando quién sale y quién entra.
export async function editarGasto(id, gasto) {
  const { error } = await supabase
    .from("gastos")
    .update({
      pagador_id: gasto.pagadorId,
      importe: gasto.importe,
      moneda: gasto.moneda,
      importe_convertido: gasto.importeConvertido,
      concepto: gasto.concepto,
      categoria: gasto.categoria,
    })
    .eq("id", id);

  if (error) throw fallo(error, "No hemos podido guardar el gasto.");

  const { error: errorBorrado } = await supabase
    .from("gastos_participantes")
    .delete()
    .eq("gasto_id", id);

  if (errorBorrado) throw fallo(errorBorrado, "No hemos podido guardar el gasto.");

  const { error: errorParticipantes } = await supabase.from("gastos_participantes").insert(
    gasto.participantes.map((viajeroId) => ({ gasto_id: id, viajero_id: viajeroId }))
  );

  if (errorParticipantes) throw fallo(errorParticipantes, "No hemos podido guardar el gasto.");

  return { ...gasto, id };
}

// Dar una deuda por pagada.
export async function marcarSaldado(viajeId, pago) {
  const { error } = await supabase
    .from("pagos_saldados")
    .insert({ viaje_id: viajeId, de_nombre: pago.de, a_nombre: pago.a });

  if (error) throw fallo(error, "No hemos podido marcar el pago.");
}

// Y volver atrás si te has equivocado.
export async function desmarcarSaldado(viajeId, pago) {
  const { error } = await supabase
    .from("pagos_saldados")
    .delete()
    .eq("viaje_id", viajeId)
    .eq("de_nombre", pago.de)
    .eq("a_nombre", pago.a);

  if (error) throw fallo(error, "No hemos podido desmarcar el pago.");
}

export async function quitarGasto(id) {
  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) throw fallo(error, "No hemos podido quitar el gasto.");
}

// Vaciar el viaje: fuera viajeros (y con ellos, sus gastos) y fuera gastos.
export async function vaciarViaje(viajeId) {
  const { error: errorSaldados } = await supabase
    .from("pagos_saldados")
    .delete()
    .eq("viaje_id", viajeId);

  if (errorSaldados) throw fallo(errorSaldados, "No hemos podido vaciar el viaje.");

  const { error } = await supabase.from("gastos").delete().eq("viaje_id", viajeId);
  if (error) throw fallo(error, "No hemos podido vaciar el viaje.");

  const { error: errorViajeros } = await supabase
    .from("viajeros")
    .delete()
    .eq("viaje_id", viajeId);

  if (errorViajeros) throw fallo(errorViajeros, "No hemos podido vaciar el viaje.");
}

// Cada cuánto miramos si los demás han apuntado algo.
const CADA = 5000;

// Estar al día de lo que toquen los otros móviles.
//
// El tiempo real de Supabase no nos vale: comprueba los permisos igual que el
// resto, pero el WebSocket no lleva nuestra cabecera con el código, así que
// nunca nos llegaría nada. Preguntamos cada pocos segundos y listo.
export function escucharCambios(dameElViaje, alCambiar) {
  // Si la pestaña está de fondo, no gastamos peticiones.
  const reloj = setInterval(() => {
    if (document.hidden) return;

    refrescarViaje(dameElViaje()).then(alCambiar).catch(() => {});
  }, CADA);

  // Y al volver a ella, nos ponemos al día enseguida.
  function alVolver() {
    if (!document.hidden) refrescarViaje(dameElViaje()).then(alCambiar).catch(() => {});
  }

  document.addEventListener("visibilitychange", alVolver);

  return () => {
    clearInterval(reloj);
    document.removeEventListener("visibilitychange", alVolver);
  };
}
