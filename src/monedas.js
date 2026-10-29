// Las monedas y el cambio entre ellas.

// Las que se suelen necesitar en un viaje.
// La API solo trae las del Banco Central Europeo. Las marcadas aMano no están
// ahí: el cambio de esas lo escribe quien apunta el gasto.
export const MONEDAS = [
  { codigo: "EUR", simbolo: "€", nombre: "Euro" },
  { codigo: "USD", simbolo: "$", nombre: "Dólar" },
  { codigo: "GBP", simbolo: "£", nombre: "Libra" },
  { codigo: "CHF", simbolo: "CHF", nombre: "Franco suizo" },
  { codigo: "JPY", simbolo: "¥", nombre: "Yen" },
  { codigo: "SEK", simbolo: "kr", nombre: "Corona sueca" },
  { codigo: "NOK", simbolo: "kr", nombre: "Corona noruega" },
  { codigo: "DKK", simbolo: "kr", nombre: "Corona danesa" },
  { codigo: "PLN", simbolo: "zł", nombre: "Zloty" },
  { codigo: "CZK", simbolo: "Kč", nombre: "Corona checa" },
  { codigo: "HUF", simbolo: "Ft", nombre: "Florín húngaro" },
  { codigo: "TRY", simbolo: "₺", nombre: "Lira turca" },
  { codigo: "MXN", simbolo: "MX$", nombre: "Peso mexicano" },
  { codigo: "BRL", simbolo: "R$", nombre: "Real" },
  { codigo: "THB", simbolo: "฿", nombre: "Baht" },
  { codigo: "MAD", simbolo: "DH", nombre: "Dírham marroquí", aMano: true },
  { codigo: "EGP", simbolo: "E£", nombre: "Libra egipcia", aMano: true },
  { codigo: "COP", simbolo: "COL$", nombre: "Peso colombiano", aMano: true },
  { codigo: "ARS", simbolo: "AR$", nombre: "Peso argentino", aMano: true },
  { codigo: "CLP", simbolo: "CLP$", nombre: "Peso chileno", aMano: true },
  { codigo: "PEN", simbolo: "S/", nombre: "Sol peruano", aMano: true },
  { codigo: "VND", simbolo: "₫", nombre: "Dong", aMano: true },
];

// Las dos primeras letras del código son las del país ("US" de USD, y "EU",
// que también tiene bandera), así que sale sola sin apuntarla en la lista.
export function banderaDe(codigo) {
  if (!/^[A-Z]{3}$/.test(codigo ?? "")) return "";
  return String.fromCodePoint(...[...codigo.slice(0, 2)].map((l) => 0x1f1a5 + l.charCodeAt(0)));
}

// "🇺🇸 USD", para los selectores.
export function monedaConBandera(codigo) {
  const bandera = banderaDe(codigo);
  return bandera ? `${bandera} ${codigo}` : codigo;
}

export function simboloDe(codigo) {
  return MONEDAS.find((m) => m.codigo === codigo)?.simbolo ?? codigo;
}

// "12,50 €". El símbolo detrás o delante según la moneda, como se escribe aquí.
export function conMoneda(importe, codigo = "EUR") {
  const cifra = importe.toFixed(2);
  const simbolo = simboloDe(codigo);

  return codigo === "USD" || codigo === "GBP"
    ? `${simbolo}${cifra}`
    : `${cifra} ${simbolo}`;
}

// El cambio nos lo da esta API, que es gratis y no pide clave.
const API = "https://api.frankfurter.dev/v1";

// Los cambios cambian poco en un día, así que con pedirlos una vez basta.
const cache = new Map();

// Cuántos "a" hacen falta para un "de". Devuelve null si no se ha podido saber.
export async function cambio(de, a) {
  if (de === a) return 1;
  // Para estas la API da error seguro, ni se pregunta.
  if (esAMano(de) || esAMano(a)) return null;

  const clave = `${de}-${a}`;
  if (cache.has(clave)) return cache.get(clave);

  try {
    const respuesta = await fetch(`${API}/latest?base=${de}&symbols=${a}`);
    if (!respuesta.ok) return null;

    const datos = await respuesta.json();
    const tasa = datos.rates?.[a];
    if (typeof tasa !== "number") return null;

    cache.set(clave, tasa);
    return tasa;
  } catch {
    // Sin internet o la API caída: que lo apunte en la moneda del viaje.
    return null;
  }
}

export function esAMano(codigo) {
  return MONEDAS.some((m) => m.codigo === codigo && m.aMano);
}

// Lo que escribe la gente: "10,85", "10.85" o " 0,092 ". Null si no vale.
export function leerCantidad(texto) {
  const limpio = String(texto ?? "").trim().replace(",", ".");
  if (!/^\d*\.?\d+$/.test(limpio)) return null;

  const cantidad = Number(limpio);
  return cantidad > 0 ? cantidad : null;
}

export const leerTasa = leerCantidad;

// Un importe de dinero: como mucho dos decimales, que no hay medios céntimos.
export function leerImporte(texto) {
  const cantidad = leerCantidad(texto);
  if (cantidad === null) return null;

  const redondo = Math.round(cantidad * 100) / 100;
  return redondo > 0 ? redondo : null;
}

// El cambio con el que se guardó un gasto. Al editarlo hay que seguir con ese,
// no con el de hoy, o se le mueven las cuentas solo por abrirlo.
export function tasaDeGasto(gasto) {
  if (!gasto.importeConvertido || !gasto.importe) return 1;
  return gasto.importeConvertido / gasto.importe;
}

// El cambio que se le aplicó, para la lista: "1 USD = 0.92 EUR". Con las monedas
// flojas, al revés: "1 EUR = 161 JPY" se entiende y "0.0062" no. El 0,1 deja
// derechos el dólar o la libra y da la vuelta al dírham y al yen.
export function cambioDelGasto(gasto, monedaViaje) {
  if (!gasto.moneda || gasto.moneda === monedaViaje || !gasto.importeConvertido) return null;

  const tasa = tasaDeGasto(gasto);
  const corta = (n) => String(Number(n.toPrecision(3)));
  return tasa >= 0.1
    ? `1 ${gasto.moneda} = ${corta(tasa)} ${monedaViaje}`
    : `1 ${monedaViaje} = ${corta(1 / tasa)} ${gasto.moneda}`;
}

// Para ponerlo en el campo: sin colas de decimales, pero sin perder precisión.
export function tasaComoTexto(tasa) {
  return String(Number(tasa.toFixed(6))).replace(".", ",");
}

// Después de apuntar uno, el siguiente suele ir igual: en Marruecos se paga todo
// en dírhams. Al editar uno viejo no, que ese puede ser de otro día y otra moneda.
export function monedaDelSiguiente(antes, guardada, editando) {
  return editando ? antes : { moneda: guardada.moneda, tasaAMano: guardada.tasaAMano };
}

// Para el selector del gasto: la del viaje, luego las que ya se han usado, y
// detrás todas las demás. En Marruecos no tienes que bajar hasta el dírham.
export function monedasEnOrden(gastos, monedaViaje) {
  const veces = new Map();
  for (const gasto of gastos) {
    const codigo = gasto.moneda ?? monedaViaje;
    veces.set(codigo, (veces.get(codigo) ?? 0) + 1);
  }

  const peso = (m) => (m.codigo === monedaViaje ? Infinity : veces.get(m.codigo) ?? 0);
  // sort es estable: con las mismas veces se quedan en el orden de la lista.
  return [...MONEDAS].sort((a, b) => peso(b) - peso(a));
}

// La moneda del viaje nuevo, sacada del país del navegador: "es-MX" es México.
// Casi todos los findes son en casa. Si no se sabe, euros, como siempre.
const DE_CADA_PAIS = {
  US: "USD", GB: "GBP", CH: "CHF", JP: "JPY", SE: "SEK", NO: "NOK", DK: "DKK",
  PL: "PLN", CZ: "CZK", HU: "HUF", TR: "TRY", MX: "MXN", BR: "BRL", TH: "THB",
  MA: "MAD", EG: "EGP", CO: "COP", AR: "ARS", CL: "CLP", PE: "PEN", VN: "VND",
};

export function monedaDeCasa(idiomas = typeof navigator === "undefined" ? [] : navigator.languages ?? []) {
  for (const idioma of idiomas) {
    let pais;
    try {
      pais = new Intl.Locale(idioma).region;
    } catch {
      // Una etiqueta rara no tiene por qué romper la pantalla de entrada.
    }
    // Manda el primero que diga país. Si no está en la tabla, es del euro.
    if (pais) return DE_CADA_PAIS[pais] ?? "EUR";
  }
  return "EUR";
}
