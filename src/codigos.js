// Sacar el código de lo que pegue la gente en "Entrar".

// Del WhatsApp llega de todo: el enlace entero, "abcd efgh", "ABCD-EFGH"...
// Si hay enlace, el código es lo que va detrás de la almohadilla.
export function codigoDeTexto(texto) {
  const pegado = String(texto ?? "");
  const enlace = pegado.match(/#([^\s#]+)/);
  const codigo = enlace ? enlace[1] : pegado;

  return codigo.replace(/[\s.-]/g, "").toUpperCase();
}
