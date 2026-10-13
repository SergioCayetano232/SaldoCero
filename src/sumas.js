// Sumar en el campo del importe: "12,5+8+3,20" son 23,70. Para juntar varios
// tickets en un gasto sin sacar la calculadora. Y restar: "60-10" con el descuento.
// Y multiplicar: "3×4,5", tres cañas. Como en el cole, primero se multiplica.

// Un número con coma o punto: 12, 12,5, 0.75, ,5
const NUMERO = /^\d*[.,]?\d+$/;

// Para multiplicar vale lo que haya a mano: × del botón, x o * del teclado.
const POR = /[×xX*]/;
const SIGNO = /[+\-×xX*]/;
const SIGNO_AL_FINAL = /[+\-×xX*]$/;

// Sin espacios y sin el signo del final, que es que vas a escribir el siguiente.
function sinColgar(texto) {
  return String(texto ?? "").replace(/\s/g, "").replace(SIGNO_AL_FINAL, "");
}

// "3×4,5" → 13,5. null si algún trozo no es un número.
function multiplicar(termino) {
  const factores = termino.split(POR);
  if (!factores.every((f) => NUMERO.test(f))) return null;
  return factores.reduce((total, f) => total * parseFloat(f.replace(",", ".")), 1);
}

// El total, redondeado a céntimos. null si no se entiende.
// Puede salir cero o negativo ("10-20"): eso ya lo mira quien lo use.
export function leerSuma(texto) {
  const limpio = sinColgar(texto);
  if (!limpio) return null;

  // "60-2×5+5" → ["60", "-", "2×5", "+", "5"]
  const trozos = limpio.split(/([+-])/);
  const valores = trozos.filter((_, i) => i % 2 === 0).map(multiplicar);
  if (valores.some((v) => v === null)) return null;

  let total = valores[0];
  for (let i = 1; i < valores.length; i++) {
    total += trozos[i * 2 - 1] === "-" ? -valores[i] : valores[i];
  }

  return Math.round(total * 100) / 100;
}

// Si hay alguna cuenta que hacer, para enseñar el resultado debajo.
export function esSuma(texto) {
  return SIGNO.test(sinColgar(texto));
}

// Con un signo ya puesto, aunque sea colgando, el campo se ensancha y caben los botones.
export function llevaSigno(texto) {
  return SIGNO.test(String(texto ?? ""));
}

// El signo que se ha quedado colgando al final, si hay. Los de multiplicar, todos como ×.
export function signoColgando(texto) {
  const ultimo = String(texto ?? "").trim().slice(-1);
  if (!SIGNO.test(ultimo)) return null;
  return POR.test(ultimo) ? "×" : ultimo;
}

// Lo que hacen los botones. Si ya había un signo al final, lo cambia:
// le has dado al + y querías restar.
export function ponerSigno(texto, signo) {
  return `${String(texto ?? "").trim().replace(SIGNO_AL_FINAL, "")}${signo}`;
}
