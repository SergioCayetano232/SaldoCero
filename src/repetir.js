// Subir un gasto al formulario, para editarlo o para apuntar otro igual.

import { participantesDeGasto, esDevolucion } from "./calculos";
import { POR_DEFECTO } from "./categorias";
import { tasaDeGasto, tasaComoTexto } from "./monedas";
import { vanPorImportes } from "./importes";
import { idsDeQuienPago } from "./pagadores";
import { quienesSiguen } from "./estancia";

export function gastoAlFormulario(gasto, viajeros, monedaViaje) {
  const moneda = gasto.moneda ?? monedaViaje;
  const suyas = gasto.partes ?? {};
  const desigual = Object.values(suyas).some((p) => p !== 1);
  // En el formulario va en positivo, con la marca de devolución aparte.
  const devolucion = esDevolucion(gasto);
  const porImportes = vanPorImportes(suyas, Math.abs(gasto.importe));

  return {
    pagadorId: gasto.pagadorId,
    importe: String(Math.abs(gasto.importe)),
    devolucion,
    moneda,
    // Con el cambio que tenía, que si no se recalcula con el de hoy.
    tasaAMano: moneda === monedaViaje ? null : tasaComoTexto(tasaDeGasto(gasto)),
    concepto: gasto.concepto,
    nota: gasto.nota ?? "",
    lugar: gasto.lugar ?? "",
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
    // Lo que puso cada uno, como texto para los campos. Vacío si pagó uno solo.
    pagadores: idsDeQuienPago(gasto).length > 1
      ? Object.fromEntries(Object.entries(gasto.pagadores).map(([id, p]) => [id, String(p)]))
      : {},
  };
}

// El último que se apuntó, no el de la fecha más nueva: la cena del viernes
// metida el domingo es la que tienes en la cabeza. Los de antes no traen
// cuándo se apuntaron; entre esos, el que va el último en la lista.
export function ultimoApuntado(gastos) {
  let ultimo = null;
  for (const gasto of gastos) {
    if (!ultimo || (gasto.creadoEn ?? "") >= (ultimo.creadoEn ?? "")) ultimo = gasto;
  }
  return ultimo;
}

// Lo mismo, pero es otro gasto: el de hoy, no el de aquel día.
export function repetirGasto(gasto, viajeros, monedaViaje, dia) {
  const formulario = gastoAlFormulario(gasto, viajeros, monedaViaje);
  // Sin los que ese día ya se han ido o aún no han llegado.
  const participantes = quienesSiguen(formulario.participantes, viajeros, dia);
  // La nota era de aquel gasto: "Luis no tomó postre" no vale para el de hoy.
  // El lugar tampoco: el desayuno de mañana puede ser ya en otra ciudad.
  return { ...formulario, fecha: dia, nota: "", lugar: undefined, participantes };
}
