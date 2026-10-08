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
export async function copiarAlPortapapeles(texto, nav = navigator) {
  try {
    await nav.clipboard.writeText(texto);
    return true;
  } catch {
    return copiarALoAntiguo(texto);
  }
}

function copiarALoAntiguo(texto) {
  if (typeof document === "undefined") return false;

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

// Bajarse el resumen en un archivo de texto, por si quieres guardarlo.
export function descargarResumen(texto, nombreViaje) {
  descargar(texto, `${nombreViaje}.txt`, "text/plain;charset=utf-8");
}

// Y los gastos en CSV. El BOM del principio es para que Excel vea las tildes.
export function descargarGastos(csv, nombreViaje) {
  descargar(`\uFEFF${csv}`, `${nombreViaje} - gastos.csv`, "text/csv;charset=utf-8");
}

function descargar(texto, nombre, tipo) {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));

  const enlace = document.createElement("a");
  enlace.href = url;
  // Sin barras ni dos puntos, que hay sistemas que no los admiten.
  enlace.download = nombre.replace(/[\\/:*?"<>|]/g, "-");
  enlace.click();

  URL.revokeObjectURL(url);
}

// El enlace que abre el viaje directamente: la app lee el código de detrás de la #.
export function enlaceDelViaje(codigo, base = window.location.origin + window.location.pathname) {
  return `${base}#${codigo}`;
}

// Lo que se manda al invitar. El código va también en el texto por si alguien
// abre el enlace en otro navegador y le toca escribirlo a mano.
export function invitacion({ nombre, codigo }, base) {
  return {
    title: `${nombre} en SaldoCero`,
    text: `Apunta aquí lo que pagues en "${nombre}". Si te pide código: ${codigo}`,
    url: enlaceDelViaje(codigo, base),
  };
}

// Con el menú de compartir del móvil si lo hay, y si no, copiando el enlace
// (o el texto, si no hay enlace, como con el resumen).
// Devuelve "compartido", "cancelado", "copiado" o "fallo".
export async function invitar(datos, nav = navigator) {
  if (nav.share) {
    try {
      await nav.share(datos);
      return "compartido";
    } catch (e) {
      // Si cierras el menú sin elegir nada, no hay que hacer nada más.
      if (e?.name === "AbortError") return "cancelado";
    }
  }

  return (await copiarAlPortapapeles(datos.url ?? datos.text, nav)) ? "copiado" : "fallo";
}
