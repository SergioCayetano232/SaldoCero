// Las tres partes del viaje: lo que apuntas, cómo vais y el viaje en sí.
// Cada atajo de teclado vive en una; si pulsas uno de otra, primero se cambia
// de pestaña y luego hace lo suyo, que así sigue funcionando todo igual.

import {
  esAtajoBuscar,
  esAtajoNuevo,
  esAtajoRepetir,
  esAtajoFoto,
  esAtajoNota,
  esAtajoLeer,
  esAtajoDictar,
  esAtajoLoMio,
  esAtajoHoy,
  esAtajoQuitarFiltros,
  esAtajoOrden,
  esAtajoPresupuesto,
  esAtajoCompartir,
  esAtajoHistorias,
  esAtajoBote,
  esAtajoBajarResumen,
  esAtajoExcel,
  esAtajoCuentas,
  esAtajoViajero,
  esAtajoInvitar,
  esAtajoCopiarCodigo,
} from "./teclado";

export const PESTANAS = ["gastos", "cuentas", "viaje"];

const DE_GASTOS = [esAtajoBuscar, esAtajoNuevo, esAtajoRepetir, esAtajoFoto, esAtajoNota, esAtajoLeer, esAtajoDictar, esAtajoLoMio, esAtajoHoy, esAtajoQuitarFiltros, esAtajoOrden];
const DE_CUENTAS = [esAtajoPresupuesto, esAtajoCompartir, esAtajoHistorias, esAtajoBote, esAtajoBajarResumen, esAtajoExcel, esAtajoCuentas];
const DE_VIAJE = [esAtajoViajero, esAtajoInvitar, esAtajoCopiarCodigo];

// La pestaña a la que lleva una tecla, o null si no es de ninguna.
export function pestanaDelAtajo(e, hayVentana = false) {
  if (DE_GASTOS.some((es) => es(e, hayVentana))) return "gastos";
  if (DE_CUENTAS.some((es) => es(e, hayVentana))) return "cuentas";
  if (DE_VIAJE.some((es) => es(e, hayVentana))) return "viaje";
  return null;
}

// Durante el viaje lo normal es apuntar; cerrado, ver cómo quedáis. Recién
// creado, sin nadie dentro, lo primero es meter a la gente.
// El atajo de "Cuentas" del icono manda sobre todo.
export function pestanaAlEntrar({ cerrado = false, aLasCuentas = false, sinViajeros = false } = {}) {
  if (aLasCuentas || cerrado) return "cuentas";
  if (sinViajeros) return "viaje";
  return "gastos";
}

export function pestanaValida(id) {
  return PESTANAS.includes(id) ? id : null;
}
