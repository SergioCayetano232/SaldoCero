// Subir un gasto al formulario, para editarlo o para apuntar otro igual.

import { participantesDeGasto } from "./calculos";
import { POR_DEFECTO } from "./categorias";
import { tasaDeGasto, tasaComoTexto } from "./monedas";
import { vanPorImportes } from "./importes";

export function gastoAlFormulario(gasto, viajeros, monedaViaje) {
  const moneda = gasto.moneda ?? monedaViaje;
  const suyas = gasto.partes ?? {};
  const desigual = Object.values(suyas).some((p) => p !== 1);
  const porImportes = vanPorImportes(suyas, gasto.importe);

  return {
    pagadorId: gasto.pagadorId,
    importe: String(gasto.importe),
    moneda,
    // Con el cambio que tenía, que si no se recalcula con el de hoy.
    tasaAMano: moneda === monedaViaje ? null : tasaComoTexto(tasaDeGasto(gasto)),
    concepto: gasto.concepto,
    nota: gasto.nota ?? "",
    categoria: gasto.categoria ?? POR_DEFECTO,
    fecha: gasto.fecha,
    participantes: participantesDeGasto(gasto, viajeros).map((v) => v.id),
    partes: desigual && !porImportes ? suyas : {},
    // Por importes, los pesos son lo que puso cada uno.
    importes: porImportes
      ? Object.fromEntries(Object.entries(suyas).map(([id, p]) => [id, String(p)]))
      : {},
    porImportes,
    repartoAbierto: desigual,
  };
}

// Lo mismo, pero es otro gasto: el de hoy, no el de aquel día.
export function repetirGasto(gasto, viajeros, monedaViaje, dia) {
  // La nota era de aquel gasto: "Luis no tomó postre" no vale para el de hoy.
  return { ...gastoAlFormulario(gasto, viajeros, monedaViaje), fecha: dia, nota: "" };
}
