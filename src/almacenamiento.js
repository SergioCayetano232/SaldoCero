// Guardar y recuperar los viajes del navegador.

const CLAVE = "saldocero-viajes";

// Las claves de la primera versión, cuando solo había un viaje.
const CLAVE_VIEJA_VIAJEROS = "saldocero-viajeros";
const CLAVE_VIEJA_GASTOS = "saldocero-gastos";

// Los ids con Date.now() se repetían si añadías dos cosas seguidas rápido.
// Ahora que los gastos guardan a sus participantes por id, eso rompía cuentas.
let ultimoId = 0;

export function nuevoId() {
  ultimoId = Math.max(ultimoId, Date.now());
  return ++ultimoId;
}

export function viajeVacio(nombre) {
  return { id: nuevoId(), nombre, viajeros: [], gastos: [] };
}

function leerJSON(clave) {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

// Rescatamos el viaje de quien ya usara la app antes de que hubiera varios.
function migrarViajeAntiguo() {
  const viajeros = leerJSON(CLAVE_VIEJA_VIAJEROS);
  const gastos = leerJSON(CLAVE_VIEJA_GASTOS);

  if (!viajeros?.length && !gastos?.length) return null;

  return {
    id: nuevoId(),
    nombre: "Mi viaje",
    viajeros: viajeros ?? [],
    gastos: gastos ?? [],
  };
}

export function cargarViajes() {
  const viajes = leerJSON(CLAVE);
  if (viajes?.length) {
    // Que los ids nuevos no pisen a los que ya existen.
    for (const viaje of viajes) {
      for (const cosa of [viaje, ...viaje.viajeros, ...viaje.gastos]) {
        ultimoId = Math.max(ultimoId, cosa.id);
      }
    }
    return viajes;
  }

  const antiguo = migrarViajeAntiguo();
  if (antiguo) return [antiguo];

  return [viajeVacio("Mi viaje")];
}

export function guardarViajes(viajes) {
  localStorage.setItem(CLAVE, JSON.stringify(viajes));
}
