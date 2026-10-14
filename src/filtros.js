// Buscar y filtrar en la lista de gastos. Solo afecta a lo que se ve: las
// cuentas del resumen siguen siendo las del viaje entero.

import { importeDeGasto, participantesDeGasto } from "./calculos";

// Con menos gastos que estos, la barra de filtros estorba más que ayuda.
export const MINIMO_PARA_FILTRAR = 4;

export const SIN_FILTROS = { texto: "", viajeroId: "", categoria: "", fecha: "", conTicket: false };

// "Cafetería" y "cafeteria" tienen que dar lo mismo al buscar.
export function normalizar(texto) {
  return (texto ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

// Buscar "12,50" para encontrar el gasto de 12,50. Sin decimales vale cualquiera
// de ese euro, que no siempre te acuerdas de los céntimos.
export function cuadraElImporte(gasto, texto) {
  const limpio = (texto ?? "").trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return false;

  const buscado = Number(limpio);
  const conDecimales = limpio.includes(".");

  // El pagado de verdad o el de la moneda del viaje: cualquiera de los dos te puede sonar.
  return [gasto.importe, importeDeGasto(gasto)].some((importe) =>
    conDecimales ? Math.abs(importe - buscado) < 0.005 : Math.floor(importe) === buscado,
  );
}

// Venir desde el resumen a ver lo de alguien: lo demás que hubiera se quita,
// que si no puede salir la lista vacía sin saber por qué.
export function soloDe(viajeroId) {
  return { ...SIN_FILTROS, viajeroId };
}

// Lo mismo al tocar un día en la gráfica.
export function soloDelDia(fecha) {
  return { ...SIN_FILTROS, fecha };
}

export function hayFiltros(filtros) {
  return Boolean(
    normalizar(filtros.texto) || filtros.viajeroId || filtros.categoria || filtros.fecha || filtros.conTicket,
  );
}

// Si no hay ni una foto, el botón de los tickets sobra.
export function hayTickets(gastos) {
  return gastos.some((gasto) => Boolean(gasto.ticket));
}

// Por persona valen los que pagó y en los que está: es lo que miras al repasar lo tuyo.
export function filtrarGastos(gastos, filtros, viajeros) {
  const buscado = normalizar(filtros.texto);

  return gastos.filter((gasto) => {
    // La nota también cuenta: "¿cuál era el de la propina?".
    const dondeBuscar = normalizar(`${gasto.concepto} ${gasto.nota ?? ""}`);
    if (buscado && !dondeBuscar.includes(buscado) && !cuadraElImporte(gasto, filtros.texto)) return false;
    if (filtros.categoria && (gasto.categoria ?? "otros") !== filtros.categoria) return false;
    if (filtros.fecha && gasto.fecha !== filtros.fecha) return false;
    // Para dar con el ticket que te pide alguien sin abrir gasto por gasto.
    if (filtros.conTicket && !gasto.ticket) return false;

    if (filtros.viajeroId) {
      const pago = gasto.pagadorId === filtros.viajeroId;
      const esta = participantesDeGasto(gasto, viajeros).some((v) => v.id === filtros.viajeroId);
      if (!pago && !esta) return false;
    }

    return true;
  });
}
