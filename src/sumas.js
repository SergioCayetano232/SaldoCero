// Sumar en el campo del importe: "12,5+8+3,20" son 23,70. Para juntar varios
// tickets en un gasto sin sacar la calculadora.

// Un número con coma o punto: 12, 12,5, 0.75, ,5
const NUMERO = /^\d*[.,]?\d+$/;

// El total, redondeado a céntimos. null si no se entiende.
// Un "+" al final no estropea nada: es que vas a escribir el siguiente.
export function leerSuma(texto) {
  const limpio = String(texto ?? "").replace(/\s/g, "").replace(/\+$/, "");
  if (!limpio) return null;

  const trozos = limpio.split("+");
  if (!trozos.every((t) => NUMERO.test(t))) return null;

  const total = trozos.reduce((suma, t) => suma + parseFloat(t.replace(",", ".")), 0);
  return Math.round(total * 100) / 100;
}

// Si hay algo que sumar, para enseñar el resultado debajo.
export function esSuma(texto) {
  return String(texto ?? "").replace(/\s|\+$/g, "").includes("+");
}
