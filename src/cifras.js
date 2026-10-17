// El viaje en cifras, para cuando se cierra: el día más caro, quién puso más...

import { importeDeGasto, calcularTotal, mediaPorGasto, participantesDeGasto } from "./calculos";
import { porCabeza } from "./porCabeza";
import { gastoPorCategoria } from "./categorias";
import { porDias, enCorto } from "./fechas";
import { conMoneda } from "./monedas";
import { BOTE, esDelBote } from "./bote";
import { normalizar } from "./filtros";
import { conceptoSinEscribir } from "./categorias";

function resumenDeGasto(gasto, personas) {
  const pagador = personas.find((p) => p.id === gasto.pagadorId);
  return {
    concepto: gasto.concepto,
    importe: importeDeGasto(gasto),
    quien: gasto.pagadorId === BOTE ? "el bote" : (pagador?.nombre ?? null),
  };
}

// Lo que más veces se apuntó: "Café, 7 veces". Sin mirar tildes ni mayúsculas.
function loMasRepetido(gastos) {
  const veces = new Map();

  for (const gasto of gastos) {
    const clave = normalizar(gasto.concepto);
    // "Gasto" o "Comida" a secas es lo que sale si lo dejas vacío, no cuenta.
    if (!clave || clave === "gasto" || clave === normalizar(conceptoSinEscribir(gasto.categoria))) continue;

    const antes = veces.get(clave);
    veces.set(clave, {
      concepto: antes?.concepto ?? gasto.concepto.trim(),
      veces: (antes?.veces ?? 0) + 1,
      total: (antes?.total ?? 0) + importeDeGasto(gasto),
    });
  }

  const lista = [...veces.values()];
  const max = Math.max(0, ...lista.map((c) => c.veces));
  const losQueMas = lista.filter((c) => c.veces === max);

  // Una vez no es repetirse, y con empate no hay uno que contar.
  return max > 1 && losQueMas.length === 1 ? losQueMas[0] : null;
}

// Lo que más le costó a cada uno de los que iban, que no tiene por qué ser lo
// más gordo. Solo los repartidos a partes iguales, que si no no hay una cifra.
function masCaroPorCabeza(gastos, personas, grande) {
  let max = null;

  for (const gasto of gastos) {
    const cada = porCabeza(gasto, personas);
    if (cada !== null && (!max || cada > max.porCabeza + 0.005)) max = { gasto, porCabeza: cada };
  }

  // Si es el mismo que el más gordo, ya sale arriba.
  if (!max || max.gasto === grande) return null;
  return {
    concepto: max.gasto.concepto,
    porCabeza: max.porCabeza,
    cuantos: participantesDeGasto(max.gasto, personas).length,
  };
}

// Lo que se pagó desde el bote. Si no lo hubo, nada.
function loDelBote(gastos, total) {
  const delBote = gastos.filter(esDelBote);
  if (delBote.length === 0) return null;

  const suma = calcularTotal(delBote);
  return { total: suma, gastos: delBote.length, porcentaje: Math.round((suma / total) * 100) };
}

// Cuántos llevan la foto del ticket. Si nadie hizo ninguna, no hay nada que contar.
function losDelTicket(gastos) {
  const conTicket = gastos.filter((g) => g.ticket).length;
  return conTicket > 0 ? { conTicket, gastos: gastos.length } : null;
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
  const cuantos = porDias(gastos)
    .filter((d) => d.fecha)
    .map((d) => ({ fecha: d.fecha, gastos: d.gastos.length }));
  const masGastos = Math.max(0, ...cuantos.map((d) => d.gastos));
  const losMasMovidos = cuantos.filter((d) => d.gastos === masGastos);
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
    media: mediaPorGasto(gastos),
    dias: dias.length,
    // Con un solo día o sin fechas, la media por día no dice nada nuevo.
    porPersonaYDia:
      dias.length > 1 && personas.length > 0 ? total / personas.length / dias.length : null,
    diaMasCaro: dias.length > 1 ? masCaro : null,
    // Si todos los días costaron lo mismo, el más barato es también el más caro.
    diaMasBarato: dias.length > 1 && masBarato.total < masCaro.total ? masBarato : null,
    // El que más gastos tuvo, que no tiene por qué ser el más caro. Con empate, nada.
    diaMasMovido: dias.length > 1 && losMasMovidos.length === 1 ? losMasMovidos[0] : null,
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
    masCaroPorCabeza: masCaroPorCabeza(gastos, personas, grande),
    masRepetido: loMasRepetido(gastos),
    delBote: loDelBote(gastos, total),
    tickets: losDelTicket(gastos),
    categoria: categoria
      ? { ...categoria, porcentaje: Math.round((categoria.total / total) * 100) }
      : null,
  };
}

// Lo mismo, para pegarlo en el grupo.
export function cifrasEnTexto(cifras, nombre, moneda) {
  const lineas = [`*${nombre}* en cifras 📊`, ""];

  const media = cifras.media !== null ? ` (${conMoneda(cifras.media, moneda)} de media)` : "";
  lineas.push(`💰 ${conMoneda(cifras.total, moneda)} en ${cifras.gastos} ${cifras.gastos === 1 ? "gasto" : "gastos"}${media}`);
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
  if (cifras.diaMasMovido) {
    lineas.push(`🐝 El día más movido: ${enCorto(cifras.diaMasMovido.fecha)}, ${cifras.diaMasMovido.gastos} gastos`);
  }
  const g = cifras.gastoMasGrande;
  lineas.push(`💸 El gasto más gordo: ${g.concepto}, ${conMoneda(g.importe, moneda)}${g.quien ? ` (${g.quien})` : ""}`);
  const p = cifras.gastoMasPequeno;
  if (p) {
    lineas.push(`🪙 El más pequeño: ${p.concepto}, ${conMoneda(p.importe, moneda)}${p.quien ? ` (${p.quien})` : ""}`);
  }
  if (cifras.masCaroPorCabeza) {
    const c = cifras.masCaroPorCabeza;
    lineas.push(`👤 Lo más caro por cabeza: ${c.concepto}, ${conMoneda(c.porCabeza, moneda)} cada uno (entre ${c.cuantos})`);
  }
  if (cifras.masRepetido) {
    const r = cifras.masRepetido;
    lineas.push(`🔁 Lo que más se repitió: ${r.concepto}, ${r.veces} veces (${conMoneda(r.total, moneda)})`);
  }
  if (cifras.delBote) {
    const b = cifras.delBote;
    lineas.push(`🫙 Del bote salieron ${conMoneda(b.total, moneda)} en ${b.gastos} ${b.gastos === 1 ? "gasto" : "gastos"}, el ${b.porcentaje} %`);
  }
  if (cifras.tickets) {
    const t = cifras.tickets;
    lineas.push(`🧾 ${t.conTicket} de ${t.gastos} ${t.gastos === 1 ? "gasto" : "gastos"} con ticket`);
  }
  if (cifras.categoria) {
    lineas.push(`${cifras.categoria.emoji} Donde más se fue: ${cifras.categoria.nombre.toLowerCase()}, el ${cifras.categoria.porcentaje} %`);
  }

  return lineas.join("\n");
}
