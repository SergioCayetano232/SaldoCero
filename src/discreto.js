// Modo discreto: las cifras de la pantalla salen tapadas, para enseñar el
// móvil en la mesa sin que se vea quién debe cuánto.

let tapado = false;
const avisar = new Set();

export function estaDiscreto() {
  return tapado;
}

export function ponerDiscreto(si) {
  if (Boolean(si) === tapado) return;
  tapado = Boolean(si);
  avisar.forEach((fn) => fn());
}

// Para useSyncExternalStore: al cambiarlo se repinta todo.
export function alCambiarDiscreto(fn) {
  avisar.add(fn);
  return () => avisar.delete(fn);
}

// Siempre los mismos puntos: si fueran tantos como cifras, se adivinaría el importe.
export const CIFRA_TAPADA = "••••";
