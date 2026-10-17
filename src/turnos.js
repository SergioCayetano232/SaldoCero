// Las lecturas del viaje pueden llegar desordenadas: la de cada pocos segundos
// sale antes de que añadas a alguien y vuelve después, sin él. Cada lectura
// coge número al salir, y si llega una más vieja que la que ya está puesta, fuera.

export function turnos() {
  let ultimo = 0;
  let puesto = 0;

  return {
    pedir: () => ++ultimo,
    // Si vale, queda como la puesta.
    vale(turno) {
      if (turno < puesto) return false;
      puesto = turno;
      return true;
    },
  };
}
