// Dónde le pagan a cada uno: su Bizum o su IBAN.

// Se escribe de mil formas: "+34 612 34 56 78", "es91-2100...". Lo dejamos pegado.
function compactar(texto) {
  return String(texto ?? "").replace(/[\s.\-/]/g, "").toUpperCase();
}

// El control de un IBAN: se pasan las cuatro primeras al final, cada letra a
// número (A=10...) y el resto de dividir entre 97 tiene que dar 1. Va a trozos
// porque el número entero no cabe en un Number.
function ibanValido(iban) {
  const girado = iban.slice(4) + iban.slice(0, 4);
  let resto = 0;
  for (const c of girado) {
    const cifra = c >= "A" ? String(c.charCodeAt(0) - 55) : c;
    resto = Number(`${resto}${cifra}`) % 97;
  }
  return resto === 1;
}

// { tipo: "bizum" | "iban", valor } o null si no es ninguna de las dos cosas.
export function leerCobro(texto) {
  const limpio = compactar(texto);

  // Bizum va con el móvil, que en España empieza por 6 o por 7.
  const movil = limpio.replace(/^(\+34|0034)/, "");
  if (/^[67]\d{8}$/.test(movil)) return { tipo: "bizum", valor: movil };

  if (/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(limpio) && ibanValido(limpio)) {
    return { tipo: "iban", valor: limpio };
  }

  return null;
}

// "612 345 678" y "ES91 2100 0418 ...", que es como se leen y se dictan.
export function cobroComoTexto(cobro) {
  if (!cobro) return "";
  if (cobro.tipo === "bizum") return cobro.valor.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  return cobro.valor.replace(/(.{4})/g, "$1 ").trim();
}

// Lo que se guarda en la base de datos es solo el valor: el tipo se saca de él.
export function cobroDe(viajero) {
  return viajero?.cobro ? leerCobro(viajero.cobro) : null;
}

// Sin nombre es que el que cobra eres tú: "Mi Bizum".
export function lineaDeCobro(cobro, nombre = null) {
  if (!cobro) return null;
  const tipo = cobro.tipo === "bizum" ? "Bizum" : "IBAN";
  const como = nombre ? `${tipo} ${tipo === "Bizum" ? "a" : "de"} ${nombre}` : `Mi ${tipo}`;
  return `${como}: ${cobroComoTexto(cobro)}`;
}
