// El concepto con la primera en mayúscula, que en la lista "cena" al lado de
// "Taxi" queda desigual. Lo demás como lo escribiste: "Cena en KFC".

export function arreglarConcepto(texto) {
  const limpio = String(texto ?? "").replace(/\s+/g, " ").trim();
  const [primera] = limpio.split(" ");

  // "iPhone", "eBay": si ya lleva mayúsculas dentro, es a propósito.
  if (primera !== primera.toLocaleLowerCase("es-ES")) return limpio;

  return limpio.charAt(0).toLocaleUpperCase("es-ES") + limpio.slice(1);
}
