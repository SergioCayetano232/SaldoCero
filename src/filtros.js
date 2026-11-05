// Buscar y filtrar en la lista de gastos. Solo afecta a lo que se ve: las
// cuentas del resumen siguen siendo las del viaje entero.

import { importeDeGasto, participantesDeGasto } from "./calculos";
import { hoy } from "./fechas";
import { BOTE, esDelBote } from "./bote";
import { categoriaDe } from "./categorias";

// Con menos gastos que estos, la barra de filtros estorba más que ayuda.
export const MINIMO_PARA_FILTRAR = 4;

export const SIN_FILTROS = { texto: "", viajeroId: "", categoria: "", fecha: "", conTicket: false, conNota: false, otraMoneda: false, deAlgunos: false };

// "Cafetería" y "cafeteria" tienen que dar lo mismo al buscar.
export function normalizar(texto) {
  return (texto ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

// "cena ana" son dos cosas a buscar, y tienen que estar las dos. "> 50" es una sola.
export function palabrasBuscadas(texto) {
  return normalizar(texto).replace(/([<>])\s+/g, "$1").split(/\s+/).filter(Boolean);
}

// Buscar "12,50" para encontrar el gasto de 12,50. Sin decimales vale cualquiera
// de ese euro, que no siempre te acuerdas de los céntimos.
export function cuadraElImporte(gasto, texto) {
  const limpio = (texto ?? "").trim().replace(",", ".");

  // ">50" o "<5". Aquí solo vale la moneda del viaje: 20 £ no son ni más ni menos que 21 €.
  const rango = limpio.match(/^([<>])(\d+(\.\d{1,2})?)$/);
  if (rango) {
    const limite = Number(rango[2]);
    return rango[1] === ">" ? importeDeGasto(gasto) > limite : importeDeGasto(gasto) < limite;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return false;

  const buscado = Number(limpio);
  const conDecimales = limpio.includes(".");

  // El pagado de verdad o el de la moneda del viaje: cualquiera de los dos te puede sonar.
  return [gasto.importe, importeDeGasto(gasto)].some((importe) =>
    conDecimales ? Math.abs(importe - buscado) < 0.005 : Math.floor(importe) === buscado,
  );
}

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

// Un día antes de otro, en UTC para que el cambio de hora no se coma un día.
function diaAntes(fecha, cuantos) {
  return new Date(Date.parse(fecha) - cuantos * 86400000).toISOString().slice(0, 10);
}

// "ayer", "sábado" o "15/10" para dar con lo de un día. La palabra ya viene sin
// tildes. Un número solo no, que ese es un importe.
export function cuadraLaFecha(gasto, palabra, dia = hoy()) {
  if (!gasto.fecha) return false;

  const cerca = ["hoy", "ayer", "anteayer"].indexOf(palabra);
  if (cerca !== -1) return gasto.fecha === diaAntes(dia, cerca);

  const semana = DIAS_SEMANA.indexOf(palabra);
  if (semana !== -1) return new Date(Date.parse(gasto.fecha)).getUTCDay() === semana;

  // "12/10-15/10" o "12-15/10", del 12 al 15 de octubre. Sin año: un viaje no
  // dura tanto, y "28/12-3/1" se entiende que pasa por Nochevieja.
  const tramo = palabra.match(/^(\d{1,2})(?:\/(\d{1,2}))?-(\d{1,2})\/(\d{1,2})$/);
  if (tramo) {
    const [, mes, diaDelMes] = gasto.fecha.split("-").map(Number);
    const clave = mes * 100 + diaDelMes;
    const desde = Number(tramo[2] ?? tramo[4]) * 100 + Number(tramo[1]);
    const hasta = Number(tramo[4]) * 100 + Number(tramo[3]);
    return desde <= hasta ? clave >= desde && clave <= hasta : clave >= desde || clave <= hasta;
  }

  // "15/10", "15-10" o con el año, "15/10/2026" o "15/10/26".
  const partes = palabra.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|\d{4}))?$/);
  if (!partes) return false;

  const [ano, mes, diaDelMes] = gasto.fecha.split("-").map(Number);
  const anoBuscado = partes[3] && Number(partes[3].length === 2 ? `20${partes[3]}` : partes[3]);
  return diaDelMes === Number(partes[1]) && mes === Number(partes[2]) && (!anoBuscado || ano === anoBuscado);
}

// Venir desde el resumen a ver lo de alguien: lo demás que hubiera se quita,
// que si no puede salir la lista vacía sin saber por qué.
export function soloDe(viajeroId) {
  return { ...SIN_FILTROS, viajeroId };
}

// "Solo lo mío" pone o quita lo tuyo. Lo demás se queda: aquí ya estás filtrando tú.
export function alternarLoMio(filtros, soy) {
  return { ...filtros, viajeroId: filtros.viajeroId === soy ? "" : soy };
}

// "Hoy" igual: pone o quita el día de hoy, y lo demás se queda.
export function alternarHoy(filtros, dia = hoy()) {
  return { ...filtros, fecha: filtros.fecha === dia ? "" : dia };
}

// Lo mismo al tocar un día en la gráfica.
export function soloDelDia(fecha) {
  return { ...SIN_FILTROS, fecha };
}

export function hayFiltros(filtros) {
  return Boolean(
    normalizar(filtros.texto) || filtros.viajeroId || filtros.categoria || filtros.fecha || filtros.conTicket || filtros.conNota || filtros.otraMoneda || filtros.deAlgunos,
  );
}

// Lo que sale cuando no queda nada. Con lo buscado delante, que a veces es solo una errata.
export function textoSinResultados(filtros) {
  const texto = (filtros.texto ?? "").trim();
  if (!texto) return "Ningún gasto encaja con eso.";

  const conOtros = hayFiltros({ ...filtros, texto: "" });
  return conOtros ? `Nada con «${texto}» con estos filtros.` : `Nada con «${texto}».`;
}

// Si no hay ni una foto, el botón de los tickets sobra.
export function hayTickets(gastos) {
  return gastos.some((gasto) => Boolean(gasto.ticket));
}

// Una nota de solo espacios es como no tenerla.
function tieneNota(gasto) {
  return Boolean(gasto.nota?.trim());
}

export function hayNotas(gastos) {
  return gastos.some(tieneNota);
}

// Los gastos de antes de las monedas no la traen, y esos iban en la del viaje.
function enOtraMoneda(gasto, monedaViaje) {
  return Boolean(gasto.moneda) && gasto.moneda !== monedaViaje;
}

export function hayOtrasMonedas(gastos, monedaViaje) {
  return gastos.some((gasto) => enOtraMoneda(gasto, monedaViaje));
}

// "Ana (12)" en el filtro por persona: los mismos que salen al elegirla.
export function cuantosDe(gastos, viajeroId, viajeros) {
  return filtrarGastos(gastos, soloDe(viajeroId), viajeros).length;
}

// "Del bote" en el filtro por persona, solo si algo se pagó con él.
export function hayGastosDelBote(gastos) {
  return gastos.some(esDelBote);
}

// Si alguien se apuntó al viaje después, lo de antes tampoco es suyo.
export function deAlgunos(gasto, viajeros) {
  return participantesDeGasto(gasto, viajeros).length < viajeros.length;
}

export function hayDeAlgunos(gastos, viajeros) {
  return gastos.some((gasto) => deAlgunos(gasto, viajeros));
}

// El botón de hoy solo sale si hoy se ha apuntado algo, que si no da una lista vacía.
export function hayGastosDeHoy(gastos, dia = hoy()) {
  return gastos.some((gasto) => gasto.fecha === dia);
}

function quienPago(gasto, viajeros) {
  if (gasto.pagadorId === BOTE) return "bote";
  return viajeros?.find((v) => v.id === gasto.pagadorId)?.nombre ?? "";
}

// Por persona valen los que pagó y en los que está: es lo que miras al repasar lo tuyo.
export function filtrarGastos(gastos, filtros, viajeros, monedaViaje) {
  const palabras = palabrasBuscadas(filtros.texto);

  return gastos.filter((gasto) => {
    // La nota también cuenta: "¿cuál era el de la propina?". Y quién pagó, que
    // escribir "ana" es más rápido que ir al desplegable. Con la categoría, igual.
    const dondeBuscar = normalizar(`${gasto.concepto} ${gasto.nota ?? ""} ${quienPago(gasto, viajeros)} ${categoriaDe(gasto.categoria).nombre}`);
    if (!palabras.every((p) => dondeBuscar.includes(p) || cuadraElImporte(gasto, p) || cuadraLaFecha(gasto, p))) return false;
    if (filtros.categoria && (gasto.categoria ?? "otros") !== filtros.categoria) return false;
    if (filtros.fecha && gasto.fecha !== filtros.fecha) return false;
    // Para dar con el ticket que te pide alguien sin abrir gasto por gasto.
    if (filtros.conTicket && !gasto.ticket) return false;
    if (filtros.conNota && !tieneNota(gasto)) return false;
    // Para repasar los cambios que se metieron a mano.
    if (filtros.otraMoneda && !enOtraMoneda(gasto, monedaViaje)) return false;
    // Los que más dudas dan al repasar: "¿y este por qué no me toca?".
    if (filtros.deAlgunos && !deAlgunos(gasto, viajeros)) return false;

    if (filtros.viajeroId) {
      const pago = gasto.pagadorId === filtros.viajeroId;
      const esta = participantesDeGasto(gasto, viajeros).some((v) => v.id === filtros.viajeroId);
      if (!pago && !esta) return false;
    }

    return true;
  });
}
