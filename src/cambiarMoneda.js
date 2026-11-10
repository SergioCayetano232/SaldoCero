// Cambiar la moneda del viaje, para cuando te equivocas al crearlo.
// Solo mientras no hay dinero apuntado: lo guardado va convertido a la de antes,
// y pasarlo a otra a toro pasado movería las cuentas.

import { MONEDAS } from "./monedas";

export function puedeCambiarMoneda(viaje) {
  if (!viaje || viaje.cerradoEn) return false;
  return !viaje.gastos?.length && !viaje.aportaciones?.length;
}

// La que se guarda, o null si no es de las que hay o es la misma.
export function monedaNueva(codigo, actual) {
  return MONEDAS.some((m) => m.codigo === codigo) && codigo !== actual ? codigo : null;
}
