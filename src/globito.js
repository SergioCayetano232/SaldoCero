// El número en el icono de la app instalada, como el de los mensajes sin leer:
// cuántos pagos tuyos quedan, sea para pagar o para cobrar.

export function cuantosMios(pagos, soy) {
  if (!soy) return 0;
  return pagos.filter((p) => !p.saldado && (p.deId === soy || p.aId === soy)).length;
}

// Solo lo tienen Chrome y Safari con la app instalada. Donde no, no pasa nada.
export function ponerGlobito(cuantos, nav = typeof navigator === "undefined" ? undefined : navigator) {
  if (!nav?.setAppBadge) return;
  const hecho = cuantos > 0 ? nav.setAppBadge(cuantos) : nav.clearAppBadge();
  // Safari lo rechaza si no hay permiso de avisos; no es para enseñar un error.
  hecho?.catch?.(() => {});
}
