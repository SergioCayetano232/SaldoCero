// Borrar con posibilidad de arrepentirse.
//
// En vez de borrar y guardar una copia por si acaso, esperamos unos segundos
// antes de borrar de verdad. Así deshacer es solo cancelar: no puede fallar,
// porque no ha pasado nada todavía.

export const ESPERA = 5000;

// Devuelve con qué cancelarlo y con qué adelantarlo.
export function borradoConEspera(borrar, alTerminar) {
  let hecho = false;

  const reloj = setTimeout(async () => {
    hecho = true;
    try {
      await borrar();
      alTerminar?.(null);
    } catch (fallo) {
      alTerminar?.(fallo);
    }
  }, ESPERA);

  return {
    // Me he arrepentido: que no se borre.
    cancelar() {
      if (hecho) return false;
      clearTimeout(reloj);
      hecho = true;
      return true;
    },

    // Que se borre ya, sin esperar.
    async ahora() {
      if (hecho) return;
      clearTimeout(reloj);
      hecho = true;
      try {
        await borrar();
        alTerminar?.(null);
      } catch (fallo) {
        alTerminar?.(fallo);
      }
    },
  };
}
