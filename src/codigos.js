// Sacar el código de lo que pegue la gente en "Entrar".

// Del WhatsApp llega de todo: el enlace entero, "abcd efgh", "ABCD-EFGH"...
// Si hay enlace, el código es lo que va detrás de la almohadilla.
export function codigoDeTexto(texto) {
  const pegado = String(texto ?? "");
  const enlace = pegado.match(/#([^\s#]+)/);
  // Sin enlace, la invitación lo trae al final: "Si te pide código: ABCD2345".
  const dicho = pegado.match(/c[oó]digo:\s*([\w.-]+)/i);
  const codigo = enlace ? enlace[1] : dicho ? dicho[1] : pegado;

  return codigo.replace(/[\s.-]/g, "").toUpperCase();
}

// El botón de Pegar. Si el navegador no deja leerlo, o no hay nada, vacío.
export async function codigoDelPortapapeles(nav = typeof navigator === "undefined" ? undefined : navigator) {
  if (!nav?.clipboard?.readText) return "";
  try {
    return codigoDeTexto(await nav.clipboard.readText());
  } catch {
    return "";
  }
}
