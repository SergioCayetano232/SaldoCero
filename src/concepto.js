// El concepto con la primera en mayúscula, que en la lista "cena" al lado de
// "Taxi" queda desigual. Lo demás como lo escribiste: "Cena en KFC".

// "Cena en el restaurante de la plaza con los de Bilbao" cabe de sobra. Más largo
// ya descoloca la lista, el Excel y el mensaje de WhatsApp.
export const LARGO_CONCEPTO = 60;

export function arreglarConcepto(texto) {
  const limpio = String(texto ?? "").replace(/\s+/g, " ").trim().slice(0, LARGO_CONCEPTO).trim();
  const [primera] = limpio.split(" ");

  // "iPhone", "eBay": si ya lleva mayúsculas dentro, es a propósito.
  if (primera !== primera.toLocaleLowerCase("es-ES")) return limpio;

  return limpio.charAt(0).toLocaleUpperCase("es-ES") + limpio.slice(1);
}

// Como en la nota, solo al final. Con 60 de tope, a las 15 ya conviene saberlo.
export function quedanEnConcepto(texto) {
  const quedan = LARGO_CONCEPTO - String(texto ?? "").length;
  return quedan <= 15 ? quedan : null;
}
