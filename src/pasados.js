import { monedaConBandera } from "./monedas";

// La lista de "Tus viajes" con el candado puesto o quitado en uno de ellos.
// Devuelve null si no cambia nada, para no escribir por escribir.
export function conCerrado(lista, codigo, cerrado) {
  const viaje = lista.find((v) => v.codigo === codigo);
  // Los guardados de antes no traen el campo: esos van como abiertos.
  if (!viaje || Boolean(viaje.cerrado) === cerrado) return null;

  return lista.map((v) => (v.codigo === codigo ? { ...v, cerrado } : v));
}

// La moneda solo cuando no es la de casa: si casi todos van en euros, una
// lista llena de 🇪🇺 no dice nada. Los guardados de antes no la traen.
export function monedaEnLista(moneda, deCasa) {
  if (!moneda || moneda === deCasa) return "";
  return monedaConBandera(moneda);
}
