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

// Metemos el código en cada petición sin tocar las cabeceras que ya pone
// Supabase (la apikey, sin ir más lejos).
function conElCodigo(input, init = {}) {
  const cabeceras = new Headers(init.headers);
  cabeceras.set("x-codigo-viaje", codigoViaje);

  return fetch(input, { ...init, headers: cabeceras });
}

export const supabase = hayConexion
  ? createClient(url, clave, { global: { fetch: conElCodigo } })
  : null;
