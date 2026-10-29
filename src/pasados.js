import { monedaConBandera } from "./monedas";

// La lista de "Tus viajes" con el candado puesto o quitado en uno de ellos.
// Devuelve null si no cambia nada, para no escribir por escribir.
export function conCerrado(lista, codigo, cerrado) {
  const viaje = lista.find((v) => v.codigo === codigo);
  // Los guardados de antes no traen el campo: esos van como abiertos.
  if (!viaje || Boolean(viaje.cerrado) === cerrado) return null;

  return lista.map((v) => (v.codigo === codigo ? { ...v, cerrado } : v));
}

// Lo que debes o te deben en ese viaje, para verlo sin entrar. Se queda lo de la
// última vez que lo abriste: si otro paga mientras, aquí no se entera.
export function conNeto(lista, codigo, neto) {
  const viaje = lista.find((v) => v.codigo === codigo);
  if (!viaje || (viaje.neto ?? null) === neto) return null;

  return lista.map((v) => (v.codigo === codigo ? { ...v, neto } : v));
}

// La moneda solo cuando no es la de casa: si casi todos van en euros, una
// lista llena de 🇪🇺 no dice nada. Los guardados de antes no la traen.
export function monedaEnLista(moneda, deCasa) {
  if (!moneda || moneda === deCasa) return "";
  return monedaConBandera(moneda);
}
