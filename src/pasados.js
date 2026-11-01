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

// Con uno solo ya está su ✕; esto es para no ir quitándolos de uno en uno.
export function seOlvidanTodos(lista) {
  return lista.length >= 2;
}

// Se pide confirmar: sin el código no hay forma de volver a entrar.
export function avisoOlvidarTodos(cuantos) {
  return `¿Quitar los ${cuantos}? Los viajes siguen ahí, pero sin el código no podrás volver a entrar.`;
}
