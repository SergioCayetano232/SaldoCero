// Borrar con posibilidad de arrepentirse.
//
// En vez de borrar y guardar una copia por si acaso, esperamos unos segundos
// antes de borrar de verdad. Así deshacer es solo cancelar: no puede fallar,
// porque no ha pasado nada todavía.

import { conMoneda } from "./monedas";
import { calcularTotal } from "./calculos";
import { limpiarNota } from "./notas";

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

// Al quitar a alguien se van con él los gastos que pagó (la base de datos los
// borra en cascada). Que se diga, que si no parece que solo se va el nombre.
export function queSeVaConViajero(viajero, gastos, moneda = "EUR") {
  const suyos = gastos.filter((g) => g.pagadorId === viajero.id);
  if (suyos.length === 0) return `a ${viajero.nombre}`;

  const total = conMoneda(calcularTotal(suyos), moneda);
  if (suyos.length === 1) return `a ${viajero.nombre} y el gasto que pagó (${total})`;
  return `a ${viajero.nombre} y los ${suyos.length} gastos que pagó (${total})`;
}

// Lo que hay que volver a guardar para dejar un gasto como estaba antes de
// editarlo, o null si no hay nada que deshacer.
export function deshacerEdicion(antes, despues) {
  // La foto no: al cambiarla o quitarla, la de antes ya se ha borrado.
  if (!antes || despues.foto || despues.quitarFoto) return null;

  const comoEstaba = {
    pagadorId: antes.pagadorId,
    importe: antes.importe,
    moneda: antes.moneda,
    importeConvertido: antes.importeConvertido,
    concepto: antes.concepto,
    categoria: antes.categoria,
    fecha: antes.fecha,
    nota: antes.nota,
    participantes: antes.participantes,
    partes: antes.partes,
    pagadores: antes.pagadores ?? null,
  };

  return mismoGasto(comoEstaba, despues) ? null : comoEstaba;
}

// Sin partes es a partes iguales, que es lo mismo que todos con un 1.
function reparto(gasto) {
  return [...gasto.participantes].sort().map((id) => `${id}:${gasto.partes?.[id] ?? 1}`).join(",");
}

function mismoGasto(a, b) {
  return (
    ["pagadorId", "importe", "moneda", "importeConvertido", "concepto", "categoria", "fecha"].every((c) => a[c] === b[c]) &&
    limpiarNota(a.nota) === limpiarNota(b.nota) &&
    reparto(a) === reparto(b) &&
    JSON.stringify(a.pagadores ?? null) === JSON.stringify(b.pagadores ?? null)
  );
}

// Quitar varios de golpe: que se diga cuántos y cuánto, que es lo que asusta.
export function queSeVaConGastos(gastos, moneda = "EUR") {
  const total = conMoneda(calcularTotal(gastos), moneda);
  return gastos.length === 1 ? `"${gastos[0].concepto}"` : `${gastos.length} gastos (${total})`;
}

export function textoQuitarVarios(cuantos) {
  return cuantos === 2 ? "quitar los dos" : `quitar los ${cuantos}`;
}
