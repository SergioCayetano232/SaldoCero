// Que no se apague el móvil mientras los demás apuntan la cámara al QR.

// Devuelve con qué soltarla. Donde no se puede (Firefox, o con la batería baja),
// sigue como siempre y ya está.
export async function mantenerEncendida(nav = typeof navigator === "undefined" ? undefined : navigator) {
  if (!nav?.wakeLock) return () => {};
  try {
    const cerrojo = await nav.wakeLock.request("screen");
    return () => cerrojo.release().catch(() => {});
  } catch {
    return () => {};
  }
}
