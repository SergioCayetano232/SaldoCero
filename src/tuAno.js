// "Tu año" en tus viajes: cuántos has hecho este año, lo que te ha tocado
// pagar a ti sumándolos todos y cuál te salió más caro. Va con lo que guarda
// el navegador de cada viaje, así que solo cuenta los que tienes en la lista.

import { balancesConBote } from "./bote";
import { conMoneda } from "./monedas";
import { enLista } from "./nombres";
import { t, tn } from "./idioma";

// Lo que te tocó a ti en ese viaje y de qué año es. Sin saber quién eres, o sin
// gastos, no hay nada que apuntar. El año, el del primer gasto: un viaje de
// Nochevieja es del año en que empezó.
export function loTuyo(viaje, soy) {
  if (!viaje || !soy || !viaje.gastos?.length) return null;
  const yo = balancesConBote(viaje.viajeros, viaje.gastos, viaje.parciales, viaje.aportaciones).find((v) => v.id === soy);
  if (!yo) return null;

  const primero = viaje.gastos.map((g) => g.fecha).filter(Boolean).sort()[0];
  if (!primero) return null;
  return { tuyo: Math.round(yo.tocaPagar * 100) / 100, ano: Number(primero.slice(0, 4)) };
}

// Como con el saldo: null si no cambia nada, para no escribir por escribir.
export function conLoTuyo(lista, codigo, lo) {
  const viaje = lista.find((v) => v.codigo === codigo);
  if (!viaje || (viaje.tuyo ?? null) === (lo?.tuyo ?? null) && (viaje.ano ?? null) === (lo?.ano ?? null)) return null;
  return lista.map((v) => (v.codigo === codigo ? { ...v, tuyo: lo?.tuyo ?? null, ano: lo?.ano ?? null } : v));
}

// Con uno solo no hay año que contar: es ese viaje, y ya sale en la lista.
export function tuAno(lista, ano) {
  const delAno = lista.filter((v) => v.ano === ano && typeof v.tuyo === "number");
  if (delAno.length < 2) return null;

  // Euros con euros: cada moneda por su lado, que sumarlas no tiene sentido.
  const porMoneda = new Map();
  for (const v of delAno) {
    const moneda = v.moneda ?? "EUR";
    porMoneda.set(moneda, (porMoneda.get(moneda) ?? 0) + v.tuyo);
  }

  // El más caro, entre los de la moneda en la que más has gastado.
  const [principal] = [...porMoneda].sort((a, b) => b[1] - a[1])[0];
  const masCaro = delAno
    .filter((v) => (v.moneda ?? "EUR") === principal)
    .reduce((max, v) => (v.tuyo > max.tuyo ? v : max));

  return {
    ano,
    viajes: delAno.length,
    porMoneda: [...porMoneda].map(([moneda, cifra]) => ({ moneda, cifra: Math.round(cifra * 100) / 100 })),
    masCaro: { nombre: masCaro.nombre, tuyo: masCaro.tuyo, moneda: principal },
  };
}

export function textoTuAno(resumen) {
  if (!resumen) return null;
  const cifras = enLista(resumen.porMoneda.map((m) => conMoneda(m.cifra, m.moneda)));
  return {
    titulo: tn(resumen.viajes, "En {ano}, 1 viaje", "En {ano}, {n} viajes", { ano: resumen.ano }),
    cifra: t("Te han tocado {cifras}", { cifras }),
    masCaro: t("El más caro, {nombre}: {cifra}", { nombre: resumen.masCaro.nombre, cifra: conMoneda(resumen.masCaro.tuyo, resumen.masCaro.moneda) }),
  };
}
