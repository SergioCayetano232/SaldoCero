// Las deudas en la moneda de casa. Si el viaje fue en yenes, lo que quieres
// saber es cuántos euros tienes que mandar.

import { cambioDelGasto, conMoneda, esAMano } from "./monedas";

// Las que se escriben a mano no tienen cambio que pedir: ni se pregunta.
export function hayQuePasarACasa(monedaViaje, casa) {
  return Boolean(monedaViaje && casa) && monedaViaje !== casa && !esAMano(monedaViaje) && !esAMano(casa);
}

export function aCasa(cantidad, tasa) {
  if (!(tasa > 0)) return null;
  return Math.round(cantidad * tasa * 100) / 100;
}

// Con ≈ delante: es el cambio de hoy, el banco te cobrará el suyo.
export function textoACasa(cantidad, tasa, casa) {
  const enCasa = aCasa(cantidad, tasa);
  return enCasa === null ? null : `≈ ${conMoneda(enCasa, casa)}`;
}

// "1 EUR = 161 JPY", vuelto como el de los gastos para que no salga 0.0062.
export function textoCambioACasa(tasa, monedaViaje, casa) {
  if (!(tasa > 0)) return null;
  return cambioDelGasto({ moneda: monedaViaje, importe: 1, importeConvertido: tasa }, casa);
}
