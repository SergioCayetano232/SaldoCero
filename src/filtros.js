// Buscar y filtrar en la lista de gastos. Solo afecta a lo que se ve: las
// cuentas del resumen siguen siendo las del viaje entero.

import { participantesDeGasto } from "./calculos";

// Con menos gastos que estos, la barra de filtros estorba más que ayuda.
export const MINIMO_PARA_FILTRAR = 4;

export const SIN_FILTROS = { texto: "", viajeroId: "", categoria: "" };

// "Cafetería" y "cafeteria" tienen que dar lo mismo al buscar.
export function normalizar(texto) {
  return (texto ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function hayFiltros(filtros) {
  return Boolean(normalizar(filtros.texto) || filtros.viajeroId || filtros.categoria);
}

// Por persona valen los que pagó y en los que está: es lo que miras al repasar lo tuyo.
export function filtrarGastos(gastos, filtros, viajeros) {
  const buscado = normalizar(filtros.texto);

  return gastos.filter((gasto) => {
    // La nota también cuenta: "¿cuál era el de la propina?".
    const dondeBuscar = normalizar(`${gasto.concepto} ${gasto.nota ?? ""}`);
    if (buscado && !dondeBuscar.includes(buscado)) return false;
    if (filtros.categoria && (gasto.categoria ?? "otros") !== filtros.categoria) return false;

    if (filtros.viajeroId) {
      const pago = gasto.pagadorId === filtros.viajeroId;
      const esta = participantesDeGasto(gasto, viajeros).some((v) => v.id === filtros.viajeroId);
      if (!pago && !esta) return false;
    }

    return true;
  });
}
