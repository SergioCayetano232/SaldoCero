import { monedaConBandera } from "./monedas";
import { t } from "./idioma";
import { normalizar } from "./filtros";

// La lista de "Tus viajes" con el candado puesto o quitado en uno de ellos, y
// cuándo se cerró, para decir desde cuándo se deben las cosas.
// Devuelve null si no cambia nada, para no escribir por escribir.
export function conCerrado(lista, codigo, cerrado, cerradoEn = null) {
  const viaje = lista.find((v) => v.codigo === codigo);
  const cuando = cerrado ? cerradoEn ?? viaje?.cerradoEn ?? null : null;
  // Los guardados de antes no traen los campos: esos van como abiertos.
  if (!viaje || (Boolean(viaje.cerrado) === cerrado && (viaje.cerradoEn ?? null) === cuando)) return null;

  return lista.map((v) => {
    if (v.codigo !== codigo) return v;
    const nuevo = { ...v, cerrado, cerradoEn: cuando };
    if (!cuando) delete nuevo.cerradoEn;
    return nuevo;
  });
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
  return t("¿Quitar los {n}? Los viajes siguen ahí, pero sin el código no podrás volver a entrar.", { n: cuantos });
}

// Con pocos se ven todos de un vistazo, el buscador solo estorbaría.
export function seBuscanViajes(lista) {
  return lista.length >= 6;
}

// Por el nombre o por el código, sin tildes ni mayúsculas.
export function buscarViajes(lista, texto) {
  const buscado = normalizar(texto);
  if (!buscado) return lista;
  return lista.filter((v) => normalizar(v.nombre).includes(buscado) || normalizar(v.codigo).includes(buscado));
}
