// Sumar en el campo del importe: "12,5+8+3,20" son 23,70. Para juntar varios
// tickets en un gasto sin sacar la calculadora. Y restar: "60-10" con el descuento.
// Y multiplicar: "3×4,5", tres cañas. Y dividir: "120÷4", la cuenta entre cuatro.
// Como en el cole, primero se multiplica y se divide. Y porcentajes, como en la
// calculadora del móvil: "120-10%" es el descuento y "45+10%" la propina.

// Un número con coma o punto: 12, 12,5, 0.75, ,5
const NUMERO = /^\d*[.,]?\d+$/;
// Y lo mismo con un % detrás: 10%, 12,5%
const PORCIENTO = /^\d*[.,]?\d+%$/;

// Para multiplicar vale lo que haya a mano: × del botón, x o * del teclado.
// Para dividir, ÷ o /.
const POR = /[×xX*]/;
const ENTRE = /[÷/]/;
const SIGNO = /[+\-×xX*÷/]/;
const SIGNO_AL_FINAL = /[+\-×xX*÷/]$/;

// Lo que se pega del banco o de la app del restaurante viene con símbolo: "25 €".
// La moneda la dice el desplegable de al lado; las letras no, que la x es multiplicar.
const SIMBOLOS = /[€$£¥]/g;

// Sin espacios, sin símbolos y sin el signo del final, que es que vas a escribir el siguiente.
function sinColgar(texto) {
  return String(texto ?? "").replace(/\s/g, "").replace(SIMBOLOS, "").replace(SIGNO_AL_FINAL, "");
}

const numero = (texto) => parseFloat(texto.replace(",", "."));

// "3×4,5" → 13,5 y "120÷4" → 30, de izquierda a derecha. null si algún trozo
// no es un número o se divide entre cero. Multiplicando, el 15% es 0,15.
function multiplicar(termino) {
  const trozos = termino.split(/([×xX*÷/])/);
  const factores = trozos.filter((_, i) => i % 2 === 0);
  // Un 10% suelto no es esto: es un trozo de la suma, y lo mira leerSuma.
  const valen =
    factores.length > 1 ? factores.every((f) => NUMERO.test(f) || PORCIENTO.test(f)) : NUMERO.test(factores[0]);
  if (!valen) return null;

  const numeros = factores.map((f) => (PORCIENTO.test(f) ? numero(f) / 100 : numero(f)));
  let total = numeros[0];
  for (let i = 1; i < numeros.length; i++) {
    if (ENTRE.test(trozos[i * 2 - 1])) {
      if (numeros[i] === 0) return null;
      total /= numeros[i];
    } else {
      total *= numeros[i];
    }
  }

  return total;
}

// El total, redondeado a céntimos. null si no se entiende.
// Puede salir cero o negativo ("10-20"): eso ya lo mira quien lo use.
export function leerSuma(texto) {
  const limpio = sinColgar(texto);
  if (!limpio) return null;

  // "60-2×5+5" → ["60", "-", "2×5", "+", "5"]
  const trozos = limpio.split(/([+-])/);
  const terminos = trozos.filter((_, i) => i % 2 === 0);

  let total = multiplicar(terminos[0]);
  if (total === null) return null;
  for (let i = 1; i < terminos.length; i++) {
    // El % va sobre lo que llevas hasta ahí: "60+5+10%" es 65 más su 10%.
    const valor = PORCIENTO.test(terminos[i]) ? (total * numero(terminos[i])) / 100 : multiplicar(terminos[i]);
    if (valor === null) return null;
    total += trozos[i * 2 - 1] === "-" ? -valor : valor;
  }

  return Math.round(total * 100) / 100;
}

// Si hay alguna cuenta que hacer, para enseñar el resultado debajo.
export function esSuma(texto) {
  return /[+\-×xX*÷/%]/.test(sinColgar(texto));
}

// El % solo tiene sentido detrás de un número que va después de otra cuenta.
export function cabePorciento(texto) {
  const limpio = String(texto ?? "").trim();
  return SIGNO.test(limpio) && /\d$/.test(limpio);
}

export function ponerPorciento(texto) {
  return `${String(texto ?? "").trim()}%`;
}

// Con un signo ya puesto, aunque sea colgando, el campo se ensancha y caben los botones.
export function llevaSigno(texto) {
  return SIGNO.test(String(texto ?? ""));
}

// El signo que se ha quedado colgando al final, si hay. Los de multiplicar, todos
// como ×, y los de dividir como ÷.
export function signoColgando(texto) {
  const ultimo = String(texto ?? "").trim().slice(-1);
  if (!SIGNO.test(ultimo)) return null;
  if (POR.test(ultimo)) return "×";
  return ENTRE.test(ultimo) ? "÷" : ultimo;
}

// Lo que hacen los botones. Si ya había un signo al final, lo cambia:
// le has dado al + y querías restar.
export function ponerSigno(texto, signo) {
  return `${String(texto ?? "").trim().replace(SIGNO_AL_FINAL, "")}${signo}`;
}
