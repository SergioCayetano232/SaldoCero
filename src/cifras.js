// El viaje en cifras, para cuando se cierra: el día más caro, quién puso más...

import { importeDeGasto, calcularTotal, mediaPorGasto, participantesDeGasto } from "./calculos";
import { porCabeza } from "./porCabeza";
import { gastoPorCategoria } from "./categorias";
import { porDias, enCorto } from "./fechas";
import { conMoneda } from "./monedas";
import { enLista } from "./nombres";
import { BOTE, esDelBote } from "./bote";
import { normalizar, deAlgunos } from "./filtros";
import { conceptoSinEscribir } from "./categorias";

function resumenDeGasto(gasto, personas) {
  const pagador = personas.find((p) => p.id === gasto.pagadorId);
  return {
    concepto: gasto.concepto,
    importe: importeDeGasto(gasto),
    quien: gasto.pagadorId === BOTE ? "el bote" : (pagador?.nombre ?? null),
  };
}

// El primero y el último del viaje, por su día. Si caen el mismo día, manda cuándo se apuntaron.
function lasPuntas(gastos, personas) {
  const conDia = gastos
    .filter((g) => g.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.creadoEn ?? "").localeCompare(b.creadoEn ?? ""));
  // En un solo día no hay principio ni final que contar.
  if (conDia.length < 2 || conDia[0].fecha === conDia.at(-1).fecha) return { primerGasto: null, ultimoGasto: null };
  return { primerGasto: resumenDeGasto(conDia[0], personas), ultimoGasto: resumenDeGasto(conDia.at(-1), personas) };
}

// A qué hora se apunta más, por cuándo se apuntó y no por el día del gasto.
// Los de antes no guardaban la hora; con menos de tres no es costumbre de nada.
export function horaDeApuntar(gastos) {
  const horas = gastos.filter((g) => g.creadoEn).map((g) => new Date(g.creadoEn).getHours());
  if (horas.length < 3) return null;

  const franjas = [
    { franja: "por la mañana", emoji: "☀️", veces: horas.filter((h) => h >= 6 && h < 14).length },
    { franja: "por la tarde", emoji: "🌇", veces: horas.filter((h) => h >= 14 && h < 21).length },
    { franja: "por la noche", emoji: "🌙", veces: horas.filter((h) => h >= 21 || h < 6).length },
  ];
  const mas = Math.max(...franjas.map((f) => f.veces));
  const ganadoras = franjas.filter((f) => f.veces === mas);
  return ganadoras.length === 1 ? { ...ganadoras[0], de: horas.length } : null;
}

// Lo más gordo que pagó cada uno, para que todos tengan algo que contar.
// Con uno solo pagando ya está el gasto más gordo; lo del bote no es de nadie.
export function elGordoDeCadaUno(gastos, personas) {
  const lista = personas
    .map((p) => {
      const suyos = gastos.filter((g) => g.pagadorId === p.id);
      if (suyos.length === 0) return null;
      const gordo = suyos.reduce((max, g) => (importeDeGasto(g) > importeDeGasto(max) ? g : max));
      return { nombre: p.nombre, concepto: gordo.concepto, importe: importeDeGasto(gordo) };
    })
    .filter(Boolean)
    .sort((a, b) => b.importe - a.importe);
  return lista.length >= 2 ? lista : null;
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

// En qué monedas se pagó, la del viaje primero. Con una sola no hay nada que contar.
function lasMonedas(gastos, monedaViaje) {
  // Los gastos de antes de las monedas no la traen, y esos iban en la del viaje.
  const monedas = [...new Set(gastos.map((g) => g.moneda ?? monedaViaje).filter(Boolean))];
  monedas.sort((a, b) => (b === monedaViaje) - (a === monedaViaje));
  return monedas.length > 1 ? monedas : null;
}

// Los que no fueron entre todos: la cena a la que no fue uno, el museo de dos...
function losDeAlgunos(gastos, personas) {
  const cuantos = gastos.filter((g) => deAlgunos(g, personas)).length;
  return cuantos > 0 ? { deAlgunos: cuantos, gastos: gastos.length } : null;
}

// personas: los viajeros con lo que ha puesto cada uno (bote incluido).
const EN_PLURAL = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];

// "Los sábados, 140 € de media". En un finde cada día sale una vez y esto sería
// el día más caro otra vez, así que solo si el que gana se ha repetido.
// Solo cuentan los días con gastos: el domingo de playa no baja la media.
export function diaDeLaSemana(dias) {
  const porDia = new Map();
  for (const { fecha, total } of dias) {
    // En UTC, que la fecha va sin hora y a medianoche aquí puede ser el día de antes.
    const semana = new Date(Date.parse(fecha)).getUTCDay();
    const antes = porDia.get(semana) ?? { total: 0, veces: 0 };
    porDia.set(semana, { total: antes.total + total, veces: antes.veces + 1 });
  }
  if (porDia.size < 2) return null;

  const medias = [...porDia].map(([semana, { total, veces }]) => ({ dia: EN_PLURAL[semana], media: total / veces, veces }));
  const max = Math.max(...medias.map((m) => m.media));
  // Por debajo del céntimo es empate.
  const ganadores = medias.filter((m) => max - m.media < 0.005);
  if (ganadores.length > 1 || ganadores[0].veces < 2) return null;
  return ganadores[0];
}

export function cifrasDelViaje(gastos, personas, monedaViaje) {
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

  // Lo que se llevó cada uno, que no es lo que puso: el que paga no siempre es el que más come.
  const tocaMas = Math.max(0, ...personas.map((p) => p.tocaPagar ?? 0));
  const losQueMasGastaron = personas.filter((p) => (p.tocaPagar ?? 0) === tocaMas);
  const tocaMenos = Math.min(...personas.map((p) => p.tocaPagar ?? 0));

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
    diaDeLaSemana: diaDeLaSemana(dias),
    horaDeApuntar: horaDeApuntar(gastos),
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
    // Si se lo repartieron todo a partes iguales, o empatan, no hay nada que contar.
    quienMasGasto:
      tocaMas > 0 && losQueMasGastaron.length === 1 && tocaMenos < tocaMas ? losQueMasGastaron[0] : null,
    // Con empate, o una sola vez, no hay nada que contar.
    quienMasVeces: masVeces > 1 && losQueMas.length === 1 ? losQueMas[0] : null,
    masCaroPorCabeza: masCaroPorCabeza(gastos, personas, grande),
    masRepetido: loMasRepetido(gastos),
    gordoDeCadaUno: elGordoDeCadaUno(gastos, personas),
    ...lasPuntas(gastos, personas),
    delBote: loDelBote(gastos, total),
    tickets: losDelTicket(gastos),
    monedas: lasMonedas(gastos, monedaViaje),
    deAlgunos: losDeAlgunos(gastos, personas),
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
  if (cifras.quienMasGasto) {
    lineas.push(`🍽️ El que más gastó: ${cifras.quienMasGasto.nombre}, ${conMoneda(cifras.quienMasGasto.tocaPagar, moneda)}`);
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
  if (cifras.diaDeLaSemana) {
    const d = cifras.diaDeLaSemana;
    lineas.push(`🗓️ Cuando más gastáis: los ${d.dia}, ${conMoneda(d.media, moneda)} de media`);
  }
  if (cifras.horaDeApuntar) {
    const h = cifras.horaDeApuntar;
    lineas.push(`${h.emoji} Apuntáis más ${h.franja}: ${h.veces} de ${h.de} gastos`);
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
  if (cifras.primerGasto) {
    lineas.push(`🚀 Empezasteis con: ${cifras.primerGasto.concepto}, ${conMoneda(cifras.primerGasto.importe, moneda)}`);
    lineas.push(`🏁 Y acabasteis con: ${cifras.ultimoGasto.concepto}, ${conMoneda(cifras.ultimoGasto.importe, moneda)}`);
  }
  if (cifras.gordoDeCadaUno) {
    const cada = cifras.gordoDeCadaUno.map((c) => `${c.nombre}, ${c.concepto} (${conMoneda(c.importe, moneda)})`);
    lineas.push(`🎯 Lo más gordo de cada uno: ${cada.join(" · ")}`);
  }
  if (cifras.masRepetido) {
    const r = cifras.masRepetido;
    lineas.push(`🔁 Lo que más se repitió: ${r.concepto}, ${r.veces} veces (${conMoneda(r.total, moneda)})`);
  }
  if (cifras.delBote) {
    const b = cifras.delBote;
    lineas.push(`🫙 Del bote salieron ${conMoneda(b.total, moneda)} en ${b.gastos} ${b.gastos === 1 ? "gasto" : "gastos"}, el ${b.porcentaje} %`);
  }
  if (cifras.monedas) {
    lineas.push(`🌍 Pagasteis en ${cifras.monedas.length} monedas: ${enLista(cifras.monedas)}`);
  }
  if (cifras.deAlgunos) {
    const a = cifras.deAlgunos;
    lineas.push(`👥 ${a.deAlgunos} de ${a.gastos} ${a.gastos === 1 ? "gasto" : "gastos"} no ${a.deAlgunos === 1 ? "fue" : "fueron"} de todos`);
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
