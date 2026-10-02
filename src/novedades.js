// Lo que han apuntado los demás desde la última vez que miramos.

import { conMoneda } from "./monedas";
import { importeDeGasto } from "./calculos";
import { BOTE } from "./bote";

// Solo lo que ha llegado nuevo, y que no hayas puesto tú desde este móvil.
// Lo borrado y lo editado no se avisa: tus propios borrados llegan igual por
// aquí, y no hay forma fiable de separarlos de los de los demás.
export function novedades(antes, despues, propios = new Set()) {
  // Si has cambiado de viaje, todo es "nuevo" y no tiene sentido avisar.
  if (!antes || !despues || antes.id !== despues.id) return { gastos: [], viajeros: [] };

  const habia = new Set([...antes.gastos, ...antes.viajeros].map((x) => x.id));
  const esNuevo = (x) => !habia.has(x.id) && !propios.has(x.id);

  return {
    gastos: despues.gastos.filter(esNuevo),
    viajeros: despues.viajeros.filter(esNuevo),
  };
}

// El texto del aviso. Null si no hay nada que contar.
export function textoDeNovedades({ gastos, viajeros }, todos, moneda) {
  const partes = [];

  if (gastos.length === 1) {
    const [g] = gastos;
    const quien = todos.find((v) => v.id === g.pagadorId)?.nombre;
    const pago = g.pagadorId === BOTE ? " (del bote)" : quien ? ` (pagó ${quien})` : "";
    partes.push(`Nuevo gasto: ${g.concepto} · ${conMoneda(importeDeGasto(g), moneda)}${pago}`);
  } else if (gastos.length > 1) {
    partes.push(`${gastos.length} gastos nuevos`);
  }

  if (viajeros.length === 1) partes.push(`Se ha unido ${viajeros[0].nombre}`);
  else if (viajeros.length > 1) partes.push(`${viajeros.length} viajeros nuevos`);

  return partes.length ? partes.join(" · ") : null;
}
