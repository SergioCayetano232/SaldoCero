// El viaje en cifras, para cuando se cierra: el día más caro, quién puso más...

import { importeDeGasto, calcularTotal } from "./calculos";
import { gastoPorCategoria } from "./categorias";
import { porDias, enCorto } from "./fechas";
import { conMoneda } from "./monedas";
import { BOTE } from "./bote";

// personas: los viajeros con lo que ha puesto cada uno (bote incluido).
export function cifrasDelViaje(gastos, personas) {
  if (gastos.length === 0) return null;

  const total = calcularTotal(gastos);
  // Los gastos de antes de las fechas no tienen día, esos no cuentan aquí.
  const dias = porDias(gastos)
    .filter((d) => d.fecha)
    .map((d) => ({ fecha: d.fecha, total: calcularTotal(d.gastos) }));

  const masCaro = dias.reduce((max, d) => (!max || d.total > max.total ? d : max), null);
  const grande = gastos.reduce((max, g) => (importeDeGasto(g) > importeDeGasto(max) ? g : max));
  const pagador = personas.find((p) => p.id === grande.pagadorId);
  const quienMas = personas.reduce((max, p) => (!max || p.puesto > max.puesto ? p : max), null);
  const [categoria] = gastoPorCategoria(gastos, importeDeGasto);

  return {
    total,
    gastos: gastos.length,
    dias: dias.length,
    // Con un solo día o sin fechas, la media por día no dice nada nuevo.
    porPersonaYDia:
      dias.length > 1 && personas.length > 0 ? total / personas.length / dias.length : null,
    diaMasCaro: dias.length > 1 ? masCaro : null,
    gastoMasGrande: {
      concepto: grande.concepto,
      importe: importeDeGasto(grande),
      quien: grande.pagadorId === BOTE ? "el bote" : (pagador?.nombre ?? null),
    },
    // Si todos han puesto lo mismo, no hay nadie a quien señalar.
    quienMasPuso:
      quienMas && personas.some((p) => p.puesto < quienMas.puesto) ? quienMas : null,
    categoria: categoria
      ? { ...categoria, porcentaje: Math.round((categoria.total / total) * 100) }
      : null,
  };
}

// Lo mismo, para pegarlo en el grupo.
export function cifrasEnTexto(cifras, nombre, moneda) {
  const lineas = [`*${nombre}* en cifras 📊`, ""];

  lineas.push(`💰 ${conMoneda(cifras.total, moneda)} en ${cifras.gastos} gastos`);
  if (cifras.porPersonaYDia !== null) {
    lineas.push(`🧍 ${conMoneda(cifras.porPersonaYDia, moneda)} por persona y día`);
  }
  if (cifras.quienMasPuso) {
    lineas.push(`🏆 El que más puso: ${cifras.quienMasPuso.nombre}, ${conMoneda(cifras.quienMasPuso.puesto, moneda)}`);
  }
  if (cifras.diaMasCaro) {
    lineas.push(`📅 El día más caro: ${enCorto(cifras.diaMasCaro.fecha)}, ${conMoneda(cifras.diaMasCaro.total, moneda)}`);
  }
  const g = cifras.gastoMasGrande;
  lineas.push(`💸 El gasto más gordo: ${g.concepto}, ${conMoneda(g.importe, moneda)}${g.quien ? ` (${g.quien})` : ""}`);
  if (cifras.categoria) {
    lineas.push(`${cifras.categoria.emoji} Donde más se fue: ${cifras.categoria.nombre.toLowerCase()}, el ${cifras.categoria.porcentaje} %`);
  }

  return lineas.join("\n");
}
