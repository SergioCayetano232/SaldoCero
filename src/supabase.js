import { createClient } from "@supabase/supabase-js";

// Estas dos salen de Supabase, en Project Settings > API.
// La clave anon es pública, va en el navegador y está pensada para eso.
// Lo que de verdad protege los viajes son las reglas del esquema, no esta clave.
const url = import.meta.env.VITE_SUPABASE_URL;
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hayConexion = Boolean(url && clave);

// El código del viaje abierto. Va en cada petición y es lo que te deja pasar.
let codigoViaje = "";

export function usarCodigo(codigo) {
  codigoViaje = codigo ?? "";
}

// Quién eres en ese viaje, para que en "Lo último" salga tu nombre. La base de
// datos solo se lo cree si es de ese mismo viaje.
let viajero = "";

export function usarViajero(id) {
  viajero = id ?? "";
}

// Metemos el código en cada petición sin tocar las cabeceras que ya pone
// Supabase (la apikey, sin ir más lejos).
function conCodigo(dameCodigo, dameViajero) {
  return (input, init = {}) => {
    const cabeceras = new Headers(init.headers);
    cabeceras.set("x-codigo-viaje", dameCodigo());
    if (dameViajero()) cabeceras.set("x-viajero", dameViajero());

    // Los borrados con keepalive, para que salgan aunque estés cerrando la pestaña.
    const keepalive = init.method === "DELETE";
    return fetch(input, { ...init, headers: cabeceras, keepalive });
  };
}

export const supabase = hayConexion
  ? createClient(url, clave, { global: { fetch: conCodigo(() => codigoViaje, () => viajero) } })
  : null;

// Para tocar otro viaje sin cambiar el código del abierto, que mientras tanto
// se sigue refrescando y leería lo que no es.
// Uno por viaje y se reutiliza: Supabase avisa en la consola por cada cliente nuevo.
const otros = new Map();

export function clienteDe(codigo, viajeroId = "") {
  const cual = `${codigo}|${viajeroId ?? ""}`;
  if (!otros.has(cual)) {
    otros.set(
      cual,
      createClient(url, clave, {
        global: { fetch: conCodigo(() => codigo, () => viajeroId ?? "") },
        // Sin sesión: no hay usuarios, y así no se pelea con el otro cliente por ella.
        auth: { persistSession: false, autoRefreshToken: false, storageKey: `saldocero-${codigo}` },
      })
    );
  }
  return otros.get(cual);
}
