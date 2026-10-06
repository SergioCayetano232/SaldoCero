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

// Para ponerlo en el campo: sin colas de decimales, pero sin perder precisión.
export function tasaComoTexto(tasa) {
  return String(Number(tasa.toFixed(6))).replace(".", ",");
}

// Después de apuntar uno, el siguiente suele ir igual: en Marruecos se paga todo
// en dírhams. Al editar uno viejo no, que ese puede ser de otro día y otra moneda.
export function monedaDelSiguiente(antes, guardada, editando) {
  return editando ? antes : { moneda: guardada.moneda, tasaAMano: guardada.tasaAMano };
}
