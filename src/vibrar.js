// Una vibración cortita para confirmar lo que haces sin tener que mirar.
// Solo va en Android: Safari no tiene vibrate y ahí simplemente no pasa nada.

// En milisegundos: vibra, para, vibra... Cortas, que molestar es muy fácil.
export const PATRONES = {
  toque: 10,
  quitar: [15, 50, 15],
  exito: [20, 60, 40],
  error: [60, 40, 60],
};

export function vibrar(tipo, nav = typeof navigator === "undefined" ? undefined : navigator) {
  const patron = PATRONES[tipo];
  if (!patron || typeof nav?.vibrate !== "function") return false;

  // Algunos navegadores lo tienen pero lanzan si la página aún no se ha tocado.
  try {
    return nav.vibrate(patron);
  } catch {
    return false;
  }
}
