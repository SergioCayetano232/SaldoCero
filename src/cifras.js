// El viaje en cifras, para cuando se cierra: el día más caro, quién puso más...

import { importeDeGasto, calcularTotal, mediaPorGasto, participantesDeGasto, soloGastos } from "./calculos";
import { porCabeza } from "./porCabeza";
import { gastoPorCategoria } from "./categorias";
import { porDias, enCorto } from "./fechas";
import { conMoneda } from "./monedas";
import { enLista } from "./nombres";
import { BOTE, esDelBote } from "./bote";
import { normalizar, deAlgunos } from "./filtros";
import { conceptoSinEscribir } from "./categorias";
import { t, tn, formatoFechas } from "./idioma";

function resumenDeGasto(gasto, personas) {
  const pagador = personas.find((p) => p.id === gasto.pagadorId);
  return {
    concepto: gasto.concepto,
    importe: importeDeGasto(gasto),
    quien: gasto.pagadorId === BOTE ? t("el bote") : (pagador?.nombre ?? null),
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
    { franja: t("por la mañana"), emoji: "☀️", veces: horas.filter((h) => h >= 6 && h < 14).length },
    { franja: t("por la tarde"), emoji: "🌇", veces: horas.filter((h) => h >= 14 && h < 21).length },
    { franja: t("por la noche"), emoji: "🌙", veces: horas.filter((h) => h >= 21 || h < 6).length },
  ];
  const mas = Math.max(...franjas.map((f) => f.veces));
  const ganadoras = franjas.filter((f) => f.veces === mas);
  return ganadoras.length === 1 ? { ...ganadoras[0], de: horas.length } : null;
}

// El que se apuntó más tarde por la noche. La 1 cuenta como más tarde que las
// 23, por eso le sumo un día a lo de antes de las 6. Si nadie trasnochó, nada.
export function elMasTrasnochado(gastos, personas) {
  let max = null;
  for (const gasto of gastos) {
    if (!gasto.creadoEn) continue;
    const cuando = new Date(gasto.creadoEn);
    const h = cuando.getHours();
    if (h >= 6 && h < 23) continue;
    const minutos = (h < 6 ? h + 24 : h) * 60 + cuando.getMinutes();
    if (!max || minutos > max.minutos) max = { gasto, minutos, hora: `${h}:${String(cuando.getMinutes()).padStart(2, "0")}` };
  }
  return max ? { ...resumenDeGasto(max.gasto, personas), hora: max.hora } : null;
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

// El día que más pagó cada uno, que no siempre es el del gasto más gordo: tres
// rondas de cañas también suman. Con un solo día de viaje sería el mismo para todos.
export function elDiaDeCadaUno(gastos, personas) {
  if (new Set(gastos.map((g) => g.fecha).filter(Boolean)).size < 2) return null;

  const lista = personas
    .map((p) => {
      const suyos = gastos.filter((g) => g.pagadorId === p.id && g.fecha);
      // porDias los da del último al primero, y con empate quiero el primero.
      const dias = porDias(suyos).reverse().map((d) => ({ fecha: d.fecha, total: calcularTotal(d.gastos) }));
      if (dias.length === 0) return null;
      const caro = dias.reduce((max, d) => (d.total > max.total + 0.005 ? d : max));
      return { nombre: p.nombre, fecha: caro.fecha, total: caro.total };
    })
    .filter(Boolean)
    .sort((a, b) => b.total - a.total);
  return lista.length >= 2 ? lista : null;
}

// La categoría que más veces salió, que no tiene por qué ser donde más dinero
// se fue: el hotel se lleva el dinero, pero los cafés se llevan las veces.
export function categoriaMasVeces(gastos, dondeMasDinero) {
  const [primera, segunda] = gastoPorCategoria(gastos, () => 1);
  if (!primera || primera.total < 2 || segunda?.total === primera.total) return null;
  if (primera.id === dondeMasDinero?.id) return null;
  return { id: primera.id, nombre: primera.nombre, emoji: primera.emoji, veces: primera.total };
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

// Los que se pagaron sin céntimos. Con lo que se pagó de verdad y no lo
// convertido: 20 dólares es redondo aunque en euros salga 18,43.
function losRedondos(gastos) {
  const redondos = gastos.filter((g) => {
    const importe = Number(g.importe);
    return importe > 0 && Math.abs(importe - Math.round(importe)) < 0.005;
  }).length;
  return gastos.length >= 3 && redondos >= 2 ? { redondos, gastos: gastos.length } : null;
}

// Lo mismo con las notas. Una nota de espacios en blanco no es nota.
function losDeNota(gastos) {
  const conNota = gastos.filter((g) => g.nota?.trim()).length;
  return conNota > 0 ? { conNota, gastos: gastos.length } : null;
}

// En qué monedas se pagó, la del viaje primero. Con una sola no hay nada que contar.
function lasMonedas(gastos, monedaViaje) {
  // Los gastos de antes de las monedas no la traen, y esos iban en la del viaje.
  const monedas = [...new Set(gastos.map((g) => g.moneda ?? monedaViaje).filter(Boolean))];
  monedas.sort((a, b) => (b === monedaViaje) - (a === monedaViaje));
  return monedas.length > 1 ? monedas : null;
}

// Lo más caro que se pagó en otra moneda, con lo que se pagó de verdad y lo que
// salió en la del viaje. Si es el más gordo del viaje ya sale arriba.
export function elGordoDeFuera(gastos, personas, monedaViaje, grande) {
  const deFuera = gastos.filter((g) => g.moneda && g.moneda !== monedaViaje);
  if (deFuera.length === 0) return null;

  const gordo = deFuera.reduce((max, g) => (importeDeGasto(g) > importeDeGasto(max) ? g : max));
  if (gordo === grande) return null;
  return { ...resumenDeGasto(gordo, personas), pagado: Number(gordo.importe), moneda: gordo.moneda };
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

  const medias = [...porDia].map(([semana, { total, veces }]) => ({ dia: t(EN_PLURAL[semana]), media: total / veces, veces }));
  const max = Math.max(...medias.map((m) => m.media));
  // Por debajo del céntimo es empate.
  const ganadores = medias.filter((m) => max - m.media < 0.005);
  if (ganadores.length > 1 || ganadores[0].veces < 2) return null;
  return ganadores[0];
}

// "La mitad del dinero se fue en 3 de 20 gastos". Con uno solo ya está el más
// gordo, y si hacen falta más de un tercio de los gastos no sorprende a nadie.
export function laMitadEn(gastos) {
  const importes = gastos.map(importeDeGasto).sort((a, b) => b - a);
  const total = importes.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;

  let suma = 0;
  let cuantos = 0;
  while (suma < total / 2 - 0.005) suma += importes[cuantos++];
  if (cuantos < 2 || cuantos * 3 > importes.length) return null;
  return { gastos: cuantos, de: importes.length };
}

// "Los findes gastáis el doble que entre semana". Por debajo de vez y media no
// tiene gracia: es lo normal, que el sábado se sale más.
export function findeContraSemana(dias) {
  const finde = [];
  const semana = [];
  for (const { fecha, total } of dias) {
    const dia = new Date(Date.parse(fecha)).getUTCDay();
    (dia === 0 || dia === 6 ? finde : semana).push(total);
  }
  if (finde.length === 0 || semana.length === 0) return null;

  const media = (totales) => totales.reduce((a, b) => a + b, 0) / totales.length;
  const enFinde = media(finde);
  const enSemana = media(semana);
  const mas = Math.max(enFinde, enSemana);
  const menos = Math.min(enFinde, enSemana);
  if (menos <= 0 || mas / menos < 1.5) return null;

  return { gana: enFinde > enSemana ? "finde" : "semana", finde: enFinde, semana: enSemana, veces: Math.round((mas / menos) * 10) / 10 };
}

// 2 → "el doble", 1.8 → "1,8 veces más".
export function cuantasVeces(veces) {
  if (veces === 2) return t("el doble");
  if (veces === 3) return t("el triple");
  return t("{n} veces más", { n: veces.toLocaleString(formatoFechas()) });
}

export function cifrasDelViaje(todos, personas, monedaViaje) {
  // Lo que se cuenta son los gastos. Las devoluciones solo restan del total.
  const gastos = soloGastos(todos);
  if (gastos.length === 0) return null;

  const total = calcularTotal(todos);
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
    findeContraSemana: findeContraSemana(dias),
    horaDeApuntar: horaDeApuntar(gastos),
    trasnochado: elMasTrasnochado(gastos, personas),
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
    diaDeCadaUno: elDiaDeCadaUno(gastos, personas),
    laMitadEn: laMitadEn(gastos),
    ...lasPuntas(gastos, personas),
    delBote: loDelBote(gastos, total),
    tickets: losDelTicket(gastos),
    notas: losDeNota(gastos),
    redondos: losRedondos(gastos),
    monedas: lasMonedas(gastos, monedaViaje),
    gordoDeFuera: elGordoDeFuera(gastos, personas, monedaViaje, grande),
    deAlgunos: losDeAlgunos(gastos, personas),
    categoria: categoria
      ? { ...categoria, porcentaje: Math.round((categoria.total / total) * 100) }
      : null,
    categoriaMasVeces: categoriaMasVeces(gastos, categoria),
  };
}

// Lo mismo, para pegarlo en el grupo.
export function cifrasEnTexto(cifras, nombre, moneda) {
  const lineas = [t("*{nombre}* en cifras 📊", { nombre }), ""];
  const dinero = (cantidad) => conMoneda(cantidad, moneda);
  const de = (quien) => (quien ? ` (${quien})` : "");

  const total = tn(cifras.gastos, "{cifra} en {n} gasto", "{cifra} en {n} gastos", { cifra: dinero(cifras.total) });
  const media = cifras.media !== null ? ` ${t("({cifra} de media)", { cifra: dinero(cifras.media) })}` : "";
  lineas.push(`💰 ${total}${media}`);
  if (cifras.porPersonaYDia !== null) {
    lineas.push(`🧍 ${t("{cifra} por persona y día", { cifra: dinero(cifras.porPersonaYDia) })}`);
  }
  if (cifras.quienMasPuso) {
    lineas.push(`🏆 ${t("El que más puso: {nombre}, {cifra}", { nombre: cifras.quienMasPuso.nombre, cifra: dinero(cifras.quienMasPuso.puesto) })}`);
  }
  if (cifras.quienMenosPuso) {
    lineas.push(`🤏 ${t("El que menos puso: {nombre}, {cifra}", { nombre: cifras.quienMenosPuso.nombre, cifra: dinero(cifras.quienMenosPuso.puesto) })}`);
  }
  if (cifras.quienMasGasto) {
    lineas.push(`🍽️ ${t("El que más gastó: {nombre}, {cifra}", { nombre: cifras.quienMasGasto.nombre, cifra: dinero(cifras.quienMasGasto.tocaPagar) })}`);
  }
  if (cifras.quienMasVeces) {
    lineas.push(`💳 ${t("El que más veces pagó: {nombre}, {n} veces", { nombre: cifras.quienMasVeces.nombre, n: cifras.quienMasVeces.veces })}`);
  }
  if (cifras.diaMasCaro) {
    lineas.push(`📅 ${t("El día más caro: {dia}, {cifra}", { dia: enCorto(cifras.diaMasCaro.fecha), cifra: dinero(cifras.diaMasCaro.total) })}`);
  }
  if (cifras.diaMasBarato) {
    lineas.push(`🧘 ${t("El día más tranquilo: {dia}, {cifra}", { dia: enCorto(cifras.diaMasBarato.fecha), cifra: dinero(cifras.diaMasBarato.total) })}`);
  }
  if (cifras.diaMasMovido) {
    lineas.push(`🐝 ${t("El día más movido: {dia}, {n} gastos", { dia: enCorto(cifras.diaMasMovido.fecha), n: cifras.diaMasMovido.gastos })}`);
  }
  if (cifras.diaDeLaSemana) {
    const d = cifras.diaDeLaSemana;
    lineas.push(`🗓️ ${t("Cuando más gastáis: los {dia}, {cifra} de media", { dia: d.dia, cifra: dinero(d.media) })}`);
  }
  if (cifras.findeContraSemana) {
    const f = cifras.findeContraSemana;
    const datos = { veces: cuantasVeces(f.veces) };
    const frase =
      f.gana === "finde"
        ? t("Los findes gastáis {veces} que entre semana: {mas} al día contra {menos}", { ...datos, mas: dinero(f.finde), menos: dinero(f.semana) })
        : t("Entre semana gastáis {veces} que los findes: {mas} al día contra {menos}", { ...datos, mas: dinero(f.semana), menos: dinero(f.finde) });
    lineas.push(`🎉 ${frase}`);
  }
  if (cifras.horaDeApuntar) {
    const h = cifras.horaDeApuntar;
    lineas.push(`${h.emoji} ${t("Apuntáis más {franja}: {veces} de {de} gastos", { franja: h.franja, veces: h.veces, de: h.de })}`);
  }
  if (cifras.trasnochado) {
    const noche = cifras.trasnochado;
    lineas.push(`🦉 ${t("Lo más trasnochado: {concepto}, apuntado a las {hora}", { concepto: noche.concepto, hora: noche.hora })}${de(noche.quien)}`);
  }
  const g = cifras.gastoMasGrande;
  lineas.push(`💸 ${t("El gasto más gordo: {concepto}, {cifra}", { concepto: g.concepto, cifra: dinero(g.importe) })}${de(g.quien)}`);
  const p = cifras.gastoMasPequeno;
  if (p) {
    lineas.push(`🪙 ${t("El más pequeño: {concepto}, {cifra}", { concepto: p.concepto, cifra: dinero(p.importe) })}${de(p.quien)}`);
  }
  if (cifras.masCaroPorCabeza) {
    const c = cifras.masCaroPorCabeza;
    lineas.push(`👤 ${t("Lo más caro por cabeza: {concepto}, {cifra} cada uno (entre {n})", { concepto: c.concepto, cifra: dinero(c.porCabeza), n: c.cuantos })}`);
  }
  if (cifras.primerGasto) {
    lineas.push(`🚀 ${t("Empezasteis con: {concepto}, {cifra}", { concepto: cifras.primerGasto.concepto, cifra: dinero(cifras.primerGasto.importe) })}`);
    lineas.push(`🏁 ${t("Y acabasteis con: {concepto}, {cifra}", { concepto: cifras.ultimoGasto.concepto, cifra: dinero(cifras.ultimoGasto.importe) })}`);
  }
  if (cifras.gordoDeCadaUno) {
    const cada = cifras.gordoDeCadaUno.map((c) => `${c.nombre}, ${c.concepto} (${dinero(c.importe)})`);
    lineas.push(`🎯 ${t("Lo más gordo de cada uno:")} ${cada.join(" · ")}`);
  }
  if (cifras.laMitadEn) {
    lineas.push(`⚖️ ${t("La mitad del dinero se fue en {n} de {de} gastos", { n: cifras.laMitadEn.gastos, de: cifras.laMitadEn.de })}`);
  }
  if (cifras.diaDeCadaUno) {
    const cada = cifras.diaDeCadaUno.map((c) => `${c.nombre}: ${enCorto(c.fecha)} (${dinero(c.total)})`);
    lineas.push(`📆 ${t("El día más caro de cada uno:")} ${cada.join(" · ")}`);
  }
  if (cifras.masRepetido) {
    const r = cifras.masRepetido;
    lineas.push(`🔁 ${t("Lo que más se repitió: {concepto}, {n} veces ({cifra})", { concepto: r.concepto, n: r.veces, cifra: dinero(r.total) })}`);
  }
  if (cifras.delBote) {
    const b = cifras.delBote;
    lineas.push(`🫙 ${tn(b.gastos, "Del bote salieron {cifra} en {n} gasto, el {tanto} %", "Del bote salieron {cifra} en {n} gastos, el {tanto} %", { cifra: dinero(b.total), tanto: b.porcentaje })}`);
  }
  if (cifras.monedas) {
    lineas.push(`🌍 ${t("Pagasteis en {n} monedas: {cuales}", { n: cifras.monedas.length, cuales: enLista(cifras.monedas) })}`);
  }
  if (cifras.gordoDeFuera) {
    const f = cifras.gordoDeFuera;
    lineas.push(`💵 ${t("Lo más caro en otra moneda: {concepto}, {pagado} ({cifra})", { concepto: f.concepto, pagado: conMoneda(f.pagado, f.moneda), cifra: dinero(f.importe) })}`);
  }
  if (cifras.deAlgunos) {
    const a = cifras.deAlgunos;
    lineas.push(`👥 ${tn(a.deAlgunos, "{n} de {de} gastos no fue de todos", "{n} de {de} gastos no fueron de todos", { de: a.gastos })}`);
  }
  if (cifras.tickets) {
    const conTicket = cifras.tickets;
    lineas.push(`🧾 ${tn(conTicket.gastos, "{veces} de {n} gasto con ticket", "{veces} de {n} gastos con ticket", { veces: conTicket.conTicket })}`);
  }
  if (cifras.redondos) {
    const r = cifras.redondos;
    lineas.push(`💯 ${r.redondos === r.gastos ? t("Todos los gastos, sin céntimos") : t("{n} de {de} gastos, sin céntimos", { n: r.redondos, de: r.gastos })}`);
  }
  if (cifras.notas) {
    const n = cifras.notas;
    lineas.push(`🗒️ ${tn(n.gastos, "{veces} de {n} gasto con nota", "{veces} de {n} gastos con nota", { veces: n.conNota })}`);
  }
  if (cifras.categoria) {
    const c = cifras.categoria;
    lineas.push(`${c.emoji} ${t("Donde más se fue: {categoria}, el {tanto} %", { categoria: t(c.nombre).toLowerCase(), tanto: c.porcentaje })}`);
  }

  if (cifras.categoriaMasVeces) {
    const c = cifras.categoriaMasVeces;
    lineas.push(`${c.emoji} ${t("La categoría estrella: {categoria}, en {n} gastos", { categoria: t(c.nombre).toLowerCase(), n: c.veces })}`);
  }

  return lineas.join("\n");
}
