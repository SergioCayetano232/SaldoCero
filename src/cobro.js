// Dónde le pagan a cada uno: su Bizum, su IBAN o su PayPal.me o Revolut.

import { t } from "./idioma";

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

// "https://www.PayPal.me/Ana" o "revolut.me/ana", de las dos formas va.
// Se guarda sin el https para que quepa en los 40 de la columna.
const ENLACES = [
  { tipo: "paypal", dominio: "paypal.me", patron: /^(?:https?:\/\/)?(?:www\.)?paypal\.(?:me|com\/paypalme)\/([a-z0-9]{1,20})\/?$/i },
  { tipo: "revolut", dominio: "revolut.me", patron: /^(?:https?:\/\/)?(?:www\.)?revolut\.me\/([a-z0-9._-]{2,25})\/?$/i },
];

function leerEnlace(texto) {
  const limpio = String(texto ?? "").trim();
  for (const { tipo, dominio, patron } of ENLACES) {
    const usuario = limpio.match(patron)?.[1];
    if (usuario) return { tipo, valor: `${dominio}/${usuario.toLowerCase()}` };
  }
  return null;
}

export function esEnlace(cobro) {
  return cobro?.tipo === "paypal" || cobro?.tipo === "revolut";
}

// { tipo: "bizum" | "iban" | "paypal" | "revolut", valor } o null si no es nada de eso.
export function leerCobro(texto) {
  const enlace = leerEnlace(texto);
  if (enlace) return enlace;

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
  if (esEnlace(cobro)) return cobro.valor;
  if (cobro.tipo === "bizum") return cobro.valor.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  return cobro.valor.replace(/(.{4})/g, "$1 ").trim();
}

// Lo que se guarda en la base de datos es solo el valor: el tipo se saca de él.
export function cobroDe(viajero) {
  return viajero?.cobro ? leerCobro(viajero.cobro) : null;
}

const NOMBRES = { bizum: "Bizum", iban: "IBAN", paypal: "PayPal", revolut: "Revolut" };

export function nombreDeCobro(cobro) {
  return NOMBRES[cobro?.tipo] ?? "";
}

// PayPal.me se deja la cifra en el enlace: paypal.me/ana/12.5EUR. Revolut no
// dice cómo hacerlo, así que ahí abre el perfil y la cifra la pone él.
export function enlaceDeCobro(cobro, cantidad = null, moneda = null) {
  if (!esEnlace(cobro)) return null;
  const base = `https://${cobro.valor}`;
  if (cobro.tipo !== "paypal" || !(cantidad > 0) || !moneda) return base;
  return `${base}/${Math.round(cantidad * 100) / 100}${moneda}`;
}

// Sin nombre es que el que cobra eres tú: "Mi Bizum".
// Con cantidad, el enlace de PayPal ya va con ella.
export function lineaDeCobro(cobro, nombre = null, cantidad = null, moneda = null) {
  if (!cobro) return null;
  const tipo = nombreDeCobro(cobro);
  const como = !nombre ? t("Mi {tipo}", { tipo }) : tipo === "Bizum" ? t("Bizum a {nombre}", { nombre }) : t("{tipo} de {nombre}", { tipo, nombre });
  return `${como}: ${enlaceDeCobro(cobro, cantidad, moneda) ?? cobroComoTexto(cobro)}`;
}

// La cifra para pegar en Bizum o en el banco: con coma, sin símbolo y sin
// ",00" si es redonda, que hay apps que no lo tragan.
export function cantidadParaPegar(cantidad) {
  const redondo = Math.round(cantidad * 100) / 100;
  return Number.isInteger(redondo) ? String(redondo) : redondo.toFixed(2).replace(".", ",");
}
