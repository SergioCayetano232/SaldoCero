// El resumen del viaje en texto, para pegarlo en el grupo.

import { conMoneda } from "./monedas";

// Un texto que se lea bien en WhatsApp: los asteriscos salen en negrita y
// los emojis ayudan a separar las partes de un vistazo.
export function resumenEnTexto({ nombre, codigo, total, balances, pagos, moneda }) {
  const lineas = [`*${nombre}* 🧳`, ""];

  lineas.push(`💰 Total del viaje: *${conMoneda(total, moneda)}*`);
  lineas.push("");

  // Lo que ha puesto cada uno.
  lineas.push("*Lo que puso cada uno*");
  for (const viajero of balances) {
    lineas.push(`· ${viajero.nombre}: ${conMoneda(viajero.puesto, moneda)}`);
  }
  lineas.push("");

  // Y cómo quedan las cuentas.
  const pendientes = pagos.filter((pago) => !pago.saldado);

  if (pagos.length === 0) {
    lineas.push("✅ Cuentas saldadas, nadie debe nada.");
  } else if (pendientes.length === 0) {
    lineas.push("✅ Todo pagado, ya estáis a cero.");
  } else {
    lineas.push("*Quién le paga a quién*");
    for (const pago of pendientes) {
      lineas.push(`· ${pago.de} → ${pago.a}: *${conMoneda(pago.cantidad, moneda)}*`);
    }

    // Las que ya están hechas, al final y sin dar la lata.
    const hechos = pagos.filter((pago) => pago.saldado);
    if (hechos.length > 0) {
      lineas.push("");
      lineas.push(`_Ya pagado: ${hechos.map((p) => `${p.de} → ${p.a}`).join(", ")}_`);
    }
  }

  lineas.push("");
  lineas.push(`Apuntado con SaldoCero · código *${codigo}*`);

  return lineas.join("\n");
}

// Copiar al portapapeles. Devuelve si ha podido.
//
// El navegador solo deja usar el portapapeles en páginas seguras, así que si
// falla probamos con el truco de toda la vida: un textarea y un execCommand.
export async function copiarAlPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return copiarALoAntiguo(texto);
  }
}

function copiarALoAntiguo(texto) {
  const campo = document.createElement("textarea");
  campo.value = texto;
  // Fuera de la vista, pero donde el navegador lo deje seleccionar.
  campo.style.position = "fixed";
  campo.style.opacity = "0";
  document.body.appendChild(campo);
  campo.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(campo);
  }
}
