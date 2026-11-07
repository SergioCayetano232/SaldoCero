// Pedir el dinero de una deuda por WhatsApp, con el mensaje ya escrito.

import { conMoneda } from "./monedas";
import { enlaceDelViaje } from "./compartir";
import { lineaDeCobro } from "./cobro";
import { cobroYo as cobroEsMio } from "./juntos";
import { t } from "./idioma";

// Si eres tú quien cobra, el mensaje va en primera persona. Si no, lo manda
// alguien de fuera de la deuda y queda raro decir "me debes".
export function mensajeDeCobro({ pago, soy, nombreViaje, codigo, moneda, base, cobro = null }) {
  const cantidad = conMoneda(pago.cantidad, moneda);
  const cobroYo = cobroEsMio(pago, soy);

  const lineas = [
    cobroYo
      ? t("Hola {de}! De *{viaje}* me debes *{cantidad}* 🙏", { de: pago.de, viaje: nombreViaje, cantidad })
      : t("Hola {de}! De *{viaje}* te toca pagarle *{cantidad}* a {a} 🙏", { de: pago.de, viaje: nombreViaje, cantidad, a: pago.a }),
  ];

  // Si sabemos dónde, que no tenga ni que preguntarlo.
  const donde = lineaDeCobro(cobro, cobroYo ? null : pago.a);
  if (donde) lineas.push("", donde);

  if (codigo) {
    lineas.push("", t("Las cuentas, aquí: {enlace}", { enlace: enlaceDelViaje(codigo, base) }));
  }

  return lineas.join("\n");
}

// Sin número de teléfono: WhatsApp te deja elegir a quién mandarlo.
export function enlaceWhatsApp(texto) {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
