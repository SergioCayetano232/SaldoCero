// Las monedas y el cambio entre ellas.

// Las que se suelen necesitar en un viaje.
// Ojo: solo valen las que trae la API del cambio, que son las del Banco Central
// Europeo. Otras como el dirham o el peso colombiano no están.
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
