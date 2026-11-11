// Pasar un gasto a otro de tus viajes, cuando lo apuntaste en el que no era.

import { BOTE } from "./bote";
import { nombreRepetido, enLista } from "./nombres";
import { POR_DEFECTO } from "./categorias";
import { t } from "./idioma";

// Los que tienes en "tus viajes", menos este y los cerrados, que ahí ya no se apunta.
export function destinosPosibles(historial, codigoActual) {
  return historial.filter((v) => v.codigo !== codigoActual && !v.cerrado);
}

// El de este viaje que se llama igual en el otro. "luis" y "Luís" valen.
function enElOtro(id, deAqui, deAlli) {
  const nombre = deAqui.find((v) => v.id === id)?.nombre;
  const igual = nombre && nombreRepetido(nombre, deAlli);
  return igual ? deAlli.find((v) => v.nombre === igual) : null;
}

// Las claves de {id: lo que sea} pasadas a los del otro viaje.
function conOtrasClaves(objeto, cambio) {
  if (!objeto) return null;
  return Object.fromEntries(Object.entries(objeto).map(([id, valor]) => [cambio.get(id), valor]));
}

// El gasto ya con la gente y la categoría del otro viaje, o { error } si no puede ir.
// La gente se busca por el nombre: los ids de un viaje no valen en otro.
export function pasarGasto(gasto, { deAqui, monedaAqui }, { nombre, viajeros: deAlli, moneda: monedaAlli, categorias = [] }) {
  if (gasto.pagadorId === BOTE) {
    return { error: t("Lo pagó el bote, y el bote es de este viaje.") };
  }

  // Si va en la moneda del otro, el cambio es uno. Si no, no hay de dónde sacarlo.
  let importeConvertido = gasto.importeConvertido;
  if (monedaAlli !== monedaAqui) {
    if (gasto.moneda !== monedaAlli) {
      return { error: t("{viaje} va en {moneda} y este gasto no.", { viaje: nombre, moneda: monedaAlli }) };
    }
    importeConvertido = gasto.importe;
  }

  const ids = [gasto.pagadorId, ...Object.keys(gasto.pagadores ?? {}), ...gasto.participantes];
  const cambio = new Map();
  const faltan = [];
  for (const id of new Set(ids)) {
    const otro = enElOtro(id, deAqui, deAlli);
    if (otro) cambio.set(id, otro.id);
    else faltan.push(deAqui.find((v) => v.id === id)?.nombre ?? "?");
  }

  if (faltan.length > 0) {
    return {
      error: t(faltan.length === 1 ? "En {viaje} no está {nombres}." : "En {viaje} no están {nombres}.", {
        viaje: nombre,
        nombres: enLista(faltan),
      }),
    };
  }

  // Una categoría propia que el otro no tiene se queda en "Otros".
  const deSiempre = !gasto.categoria?.startsWith("p-");
  const categoria = deSiempre || categorias.some((c) => c.id === gasto.categoria) ? gasto.categoria : POR_DEFECTO;

  return {
    gasto: {
      ...gasto,
      pagadorId: cambio.get(gasto.pagadorId),
      pagadores: conOtrasClaves(gasto.pagadores, cambio),
      participantes: gasto.participantes.map((id) => cambio.get(id)),
      partes: conOtrasClaves(gasto.partes, cambio) ?? {},
      importeConvertido,
      categoria,
      // La duda es de la gente de aquí, allí no la va a contestar nadie.
      duda: null,
    },
  };
}
