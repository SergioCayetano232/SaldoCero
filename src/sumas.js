// Sumar en el campo del importe: "12,5+8+3,20" son 23,70. Para juntar varios
// tickets en un gasto sin sacar la calculadora. Y restar: "60-10" con el descuento.

// Un número con coma o punto: 12, 12,5, 0.75, ,5
const NUMERO = /^\d*[.,]?\d+$/;

// Sin espacios y sin el signo del final, que es que vas a escribir el siguiente.
function sinColgar(texto) {
  return String(texto ?? "").replace(/\s/g, "").replace(/[+-]$/, "");
}

// El total, redondeado a céntimos. null si no se entiende.
// Puede salir cero o negativo ("10-20"): eso ya lo mira quien lo use.
export function leerSuma(texto) {
  const limpio = sinColgar(texto);
  if (!limpio) return null;

  // "60-10+5" → ["60", "-", "10", "+", "5"]
  const trozos = limpio.split(/([+-])/);
  const numeros = trozos.filter((_, i) => i % 2 === 0);
  if (!numeros.every((t) => NUMERO.test(t))) return null;

  let total = parseFloat(trozos[0].replace(",", "."));
  for (let i = 1; i < trozos.length; i += 2) {
    const n = parseFloat(trozos[i + 1].replace(",", "."));
    total += trozos[i] === "-" ? -n : n;
  }

  return Math.round(total * 100) / 100;
}

// Si hay algo que sumar o restar, para enseñar el resultado debajo.
export function esSuma(texto) {
  return /[+-]/.test(sinColgar(texto));
}

// Con un signo ya puesto, aunque sea colgando, el campo se ensancha y caben los dos botones.
export function llevaSigno(texto) {
  return /[+-]/.test(String(texto ?? ""));
}

// Lo que hacen los botones de + y −. Si ya había un signo al final, lo cambia:
// le has dado al + y querías restar.
export function ponerSigno(texto, signo) {
  return `${String(texto ?? "").trim().replace(/[+-]$/, "")}${signo}`;
}
