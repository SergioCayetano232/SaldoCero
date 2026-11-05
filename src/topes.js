// Topes por categoría: "en comida, como mucho 300". Va aparte del presupuesto
// del viaje, que puede estar o no.

import { CATEGORIAS, POR_DEFECTO } from "./categorias";
import { calcularTotal } from "./calculos";
import { estadoPresupuesto, teSacaDelPresupuesto } from "./presupuesto";

// Lo que llega de la base de datos puede traer de todo: solo valen las
// categorías que existen y con una cifra de verdad.
export function limpiarTopes(crudo) {
  if (!crudo || typeof crudo !== "object") return {};
  return Object.fromEntries(
    CATEGORIAS.filter((c) => Number(crudo[c.id]) > 0).map((c) => [c.id, Number(crudo[c.id])])
  );
}

// Poner, cambiar o quitar uno. Sin ninguno, null, que es como se guarda vacío.
export function conTope(topes, categoria, cantidad) {
  const nuevos = { ...topes };
  if (cantidad > 0) nuevos[categoria] = cantidad;
  else delete nuevos[categoria];
  return Object.keys(nuevos).length > 0 ? nuevos : null;
}

function gastadoEn(gastos, categoria) {
  // Una devolución puede dejarla en negativo: para el tope, cero.
  return Math.max(0, calcularTotal(gastos.filter((g) => (g.categoria ?? POR_DEFECTO) === categoria)));
}

// Las que tienen tope, en el orden de siempre, con lo gastado y cómo va la barra.
export function estadoDeTopes(gastos, topes) {
  return CATEGORIAS.filter((c) => topes[c.id] > 0).map((c) => {
    const gastado = gastadoEn(gastos, c.id);
    return { ...c, tope: topes[c.id], gastado, estado: estadoPresupuesto(gastado, topes[c.id]) };
  });
}

export function sinTope(topes) {
  return CATEGORIAS.filter((c) => !(topes[c.id] > 0));
}

// Como con el presupuesto: solo avisa si es este gasto el que la pasa.
export function teSacaDelTope(gastos, categoria, importe, topes) {
  return teSacaDelPresupuesto(gastadoEn(gastos, categoria), importe, topes[categoria]);
}
