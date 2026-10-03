// Pillar el gasto que se apunta dos veces: Ana apunta la cena y, sin verlo,
// Luis también. No se bloquea nada, solo se pregunta.

import { importeDeGasto } from "./calculos";
import { normalizar } from "./filtros";

// Medio céntimo: lo mismo convertido dos veces puede bailar en el último decimal.
const MARGEN = 0.005;

// Los gastos que se parecen sospechosamente al que vas a apuntar: mismo día y
// mismo importe. Primero los de concepto parecido, que son los más claros.
export function posiblesRepetidos(nuevo, gastos) {
  const importe = importeDeGasto(nuevo);
  const concepto = normalizar(nuevo.concepto);

  const parecidos = gastos.filter(
    (g) =>
      g.id !== nuevo.id &&
      g.fecha === nuevo.fecha &&
      Math.abs(importeDeGasto(g) - importe) < MARGEN
  );

  const mismoConcepto = (g) => {
    const otro = normalizar(g.concepto);
    return Boolean(concepto && otro) && (otro.includes(concepto) || concepto.includes(otro));
  };

  return [...parecidos].sort((a, b) => mismoConcepto(b) - mismoConcepto(a));
}
