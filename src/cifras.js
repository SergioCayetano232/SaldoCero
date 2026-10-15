// El viaje en cifras, para cuando se cierra: el día más caro, quién puso más...

import { importeDeGasto, calcularTotal } from "./calculos";
import { gastoPorCategoria } from "./categorias";
import { porDias, enCorto } from "./fechas";
import { conMoneda } from "./monedas";
import { BOTE } from "./bote";

function resumenDeGasto(gasto, personas) {
  const pagador = personas.find((p) => p.id === gasto.pagadorId);
  return {
    concepto: gasto.concepto,
    importe: importeDeGasto(gasto),
    quien: gasto.pagadorId === BOTE ? "el bote" : (pagador?.nombre ?? null),
  };
}

// personas: los viajeros con lo que ha puesto cada uno (bote incluido).
export function cifrasDelViaje(gastos, personas) {
  if (gastos.length === 0) return null;

  const total = calcularTotal(gastos);
  // Los gastos de antes de las fechas no tienen día, esos no cuentan aquí.
  const dias = porDias(gastos)
    .filter((d) => d.fecha)
    .map((d) => ({ fecha: d.fecha, total: calcularTotal(d.gastos) }));

  const masCaro = dias.reduce((max, d) => (!max || d.total > max.total ? d : max), null);
  const masBarato = dias.reduce((min, d) => (!min || d.total < min.total ? d : min), null);
  const grande = gastos.reduce((max, g) => (importeDeGasto(g) > importeDeGasto(max) ? g : max));
  const pequeno = gastos.reduce((min, g) => (importeDeGasto(g) < importeDeGasto(min) ? g : min));
  const quienMas = personas.reduce((max, p) => (!max || p.puesto > max.puesto ? p : max), null);
  const menos = Math.min(...personas.map((p) => p.puesto));
  const losQueMenos = personas.filter((p) => p.puesto === menos);
  const [categoria] = gastoPorCategoria(gastos, importeDeGasto);

  // Cuántas veces sacó la cartera cada uno. Lo del bote no es de nadie.
  const veces = personas.map((p) => ({ ...p, veces: gastos.filter((g) => g.pagadorId === p.id).length }));
  const masVeces = Math.max(0, ...veces.map((p) => p.veces));
  const losQueMas = veces.filter((p) => p.veces === masVeces);

  return {
    total,
    gastos: gastos.length,
    dias: dias.length,
    // Con un solo día o sin fechas, la media por día no dice nada nuevo.
    porPersonaYDia:
      dias.length > 1 && personas.length > 0 ? total / personas.length / dias.length : null,
    diaMasCaro: dias.length > 1 ? masCaro : null,
    // Si todos los días costaron lo mismo, el más barato es también el más caro.
    diaMasBarato: dias.length > 1 && masBarato.total < masCaro.total ? masBarato : null,
    gastoMasGrande: resumenDeGasto(grande, personas),
    // Con uno solo, o si todos costaron igual, sería el mismo que el más gordo.
    gastoMasPequeno:
      importeDeGasto(pequeno) < importeDeGasto(grande) ? resumenDeGasto(pequeno, personas) : null,
    // Si todos han puesto lo mismo, no hay nadie a quien señalar.
    quienMasPuso:
      quienMas && personas.some((p) => p.puesto < quienMas.puesto) ? quienMas : null,
    // Si empatan por abajo, señalar a uno solo sería injusto.
    quienMenosPuso:
      losQueMenos.length === 1 && personas.some((p) => p.puesto > menos) ? losQueMenos[0] : null,
    // Con empate, o una sola vez, no hay nada que contar.
    quienMasVeces: masVeces > 1 && losQueMas.length === 1 ? losQueMas[0] : null,
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
  if (cifras.quienMenosPuso) {
    lineas.push(`🤏 El que menos puso: ${cifras.quienMenosPuso.nombre}, ${conMoneda(cifras.quienMenosPuso.puesto, moneda)}`);
  }
  if (cifras.quienMasVeces) {
    lineas.push(`💳 El que más veces pagó: ${cifras.quienMasVeces.nombre}, ${cifras.quienMasVeces.veces} veces`);
  }
  if (cifras.diaMasCaro) {
    lineas.push(`📅 El día más caro: ${enCorto(cifras.diaMasCaro.fecha)}, ${conMoneda(cifras.diaMasCaro.total, moneda)}`);
  }
  if (cifras.diaMasBarato) {
    lineas.push(`🧘 El día más tranquilo: ${enCorto(cifras.diaMasBarato.fecha)}, ${conMoneda(cifras.diaMasBarato.total, moneda)}`);
  }
  const g = cifras.gastoMasGrande;
  lineas.push(`💸 El gasto más gordo: ${g.concepto}, ${conMoneda(g.importe, moneda)}${g.quien ? ` (${g.quien})` : ""}`);
  const p = cifras.gastoMasPequeno;
  if (p) {
    lineas.push(`🪙 El más pequeño: ${p.concepto}, ${conMoneda(p.importe, moneda)}${p.quien ? ` (${p.quien})` : ""}`);
  }
  if (cifras.categoria) {
    lineas.push(`${cifras.categoria.emoji} Donde más se fue: ${cifras.categoria.nombre.toLowerCase()}, el ${cifras.categoria.porcentaje} %`);
  }

  return lineas.join("\n");
}
