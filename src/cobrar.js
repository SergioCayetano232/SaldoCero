// Pedir el dinero de una deuda por WhatsApp, con el mensaje ya escrito.

import { conMoneda } from "./monedas";
import { enlaceDelViaje } from "./compartir";

// Si eres tú quien cobra, el mensaje va en primera persona. Si no, lo manda
// alguien de fuera de la deuda y queda raro decir "me debes".
export function mensajeDeCobro({ pago, soy, nombreViaje, codigo, moneda, base }) {
  const cantidad = conMoneda(pago.cantidad, moneda);

  const lineas = [
    soy && soy === pago.aId
      ? `Hola ${pago.de}! De *${nombreViaje}* me debes *${cantidad}* 🙏`
      : `Hola ${pago.de}! De *${nombreViaje}* te toca pagarle *${cantidad}* a ${pago.a} 🙏`,
  ];

  if (codigo) {
    lineas.push("", `Las cuentas, aquí: ${enlaceDelViaje(codigo, base)}`);
  }

  return lineas.join("\n");
}

// Sin número de teléfono: WhatsApp te deja elegir a quién mandarlo.
export function enlaceWhatsApp(texto) {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
