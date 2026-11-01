// Los atajos para pagar a cuenta: casi siempre se da la mitad o todo.

// Con coma, como se escribe en el campo: 11,74 y no 11.74.
function comoTexto(n) {
  return String(n).replace(".", ",");
}

export function trozosDeDeuda(cantidad) {
  if (!(cantidad > 0)) return [];

  // Con toFixed, como conMoneda: con Math.round una deuda de 11,735 sale 11,73
  // en pantalla y 11,74 en el campo.
  const todo = Number(cantidad.toFixed(2));
  const mitad = Number((cantidad / 2).toFixed(2));

  // Con un céntimo de deuda, la mitad redondeada ya es todo.
  if (mitad >= todo) return [{ nombre: "Todo", texto: comoTexto(todo) }];

  return [
    { nombre: "La mitad", texto: comoTexto(mitad) },
    { nombre: "Todo", texto: comoTexto(todo) },
  ];
}
