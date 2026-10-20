// La cuenta del restaurante plato a plato: cada uno paga lo suyo, y lo que no
// está en ningún plato (el pan, la propina) va entre todos a partes iguales.
// Sale en importes, así que se guarda igual que el reparto por importes.

import { leerSuma } from "./sumas";

export function platoNuevo() {
  return { importe: "", de: [] };
}

// Los céntimos sueltos van rotando, que si no siempre le caen al primero.
function repartir(centimos, ids, cuentas, giro) {
  const base = Math.floor(centimos / ids.length);
  const sobran = centimos - base * ids.length;

  ids.forEach((id, i) => {
    const puesto = (((i - giro.valor) % ids.length) + ids.length) % ids.length;
    cuentas[id] += base + (puesto < sobran ? 1 : 0);
  });
  giro.valor += sobran;
}

// null sin importe. Si los platos se pasan del total, importes va a null y
// entreTodos sale en negativo: es lo que sobra.
export function repartoPorPlatos(platos, ids, total) {
  const totalCentimos = Math.round(total * 100);
  if (!(totalCentimos > 0) || ids.length === 0) return null;

  const cuentas = Object.fromEntries(ids.map((id) => [id, 0]));
  const giro = { valor: 0 };
  let enPlatos = 0;

  for (const plato of platos) {
    const centimos = Math.round((leerSuma(plato.importe) ?? 0) * 100);
    if (centimos <= 0) continue;

    // Sin nadie marcado es de la mesa, como el vino.
    const suyos = plato.de.filter((id) => ids.includes(id));
    repartir(centimos, suyos.length > 0 ? suyos : ids, cuentas, giro);
    enPlatos += centimos;
  }

  const resto = totalCentimos - enPlatos;
  if (resto < 0) return { importes: null, entreTodos: resto / 100 };

  repartir(resto, ids, cuentas, giro);
  return {
    importes: Object.fromEntries(ids.map((id) => [id, String(cuentas[id] / 100)])),
    entreTodos: resto / 100,
  };
}

// Tocar a alguien en un plato lo pone o lo quita.
export function alternarEnPlato(plato, id) {
  const de = plato.de.includes(id) ? plato.de.filter((x) => x !== id) : [...plato.de, id];
  return { ...plato, de };
}
