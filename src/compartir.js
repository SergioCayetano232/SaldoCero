// El resumen del viaje en texto, para pegarlo en el grupo.

import { conMoneda } from "./monedas";
import { cuandoFue, hoy } from "./fechas";
import { vibrar } from "./vibrar";

// Un texto que se lea bien en WhatsApp: los asteriscos salen en negrita y
// los emojis ayudan a separar las partes de un vistazo.
export function resumenEnTexto({ nombre, codigo, total, balances, pagos, moneda, cifras, gastos = [], enlace }) {
  const lineas = [`*${nombre}* 🧳`];
  const cuando = cuandoFue(gastos.map((g) => g.fecha));
  if (cuando) lineas.push(`📅 ${cuando}`);
  lineas.push("");

  lineas.push(`💰 Total del viaje: *${conMoneda(total, moneda)}*${porCabeza(total, balances, moneda)}`);
  lineas.push("");

  // Lo que ha puesto cada uno, y al lado lo que le tocaba: así la deuda se entiende sola.
  lineas.push("*Lo que puso cada uno*");
  for (const viajero of balances) {
    lineas.push(`· ${viajero.nombre}: ${conMoneda(viajero.puesto, moneda)}${loQueLeTocaba(viajero, moneda)}`);
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

  // Las cifras solo van en el txt del viaje cerrado; en el grupo ya se comparten aparte.
  if (cifras) {
    lineas.push("");
    lineas.push(cifras);
  }

  lineas.push("");
  lineas.push(`Apuntado con SaldoCero · código *${codigo}*`);
  // Al final y solo, que WhatsApp lo vuelve tocable y abre el viaje sin teclear nada.
  if (enlace) lineas.push(enlace);

  return lineas.join("\n");
}

// Con gastos que no son de todos, o repartidos a partes desiguales, a cada uno
// le toca distinto: entonces es una media y hay que decirlo.
export function porCabeza(total, balances, moneda) {
  if (balances.length < 2 || total <= 0) return "";

  const partes = balances.map((v) => v.tocaPagar ?? 0);
  const iguales = Math.max(...partes) - Math.min(...partes) < 0.01;
  return ` · ${conMoneda(total / balances.length, moneda)} por cabeza${iguales ? "" : " de media"}`;
}

// Si puso justo lo suyo, no hace falta decirlo.
function loQueLeTocaba({ puesto, tocaPagar }, moneda) {
  if (tocaPagar === undefined || Math.abs(puesto - tocaPagar) < 0.01) return "";
  return ` (le tocaban ${conMoneda(tocaPagar, moneda)})`;
}

// Copiar al portapapeles. Devuelve si ha podido, y en el móvil vibra para que
// lo sepas sin mirar.
//
// El navegador solo deja usar el portapapeles en páginas seguras, así que si
// falla probamos con el truco de toda la vida: un textarea y un execCommand.
export async function copiarAlPortapapeles(texto, nav = navigator) {
  let hecho;
  try {
    await nav.clipboard.writeText(texto);
    hecho = true;
  } catch {
    hecho = copiarALoAntiguo(texto);
  }

  if (hecho) vibrar("toque", nav);
  return hecho;
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

// Con el día delante de la extensión: si te lo bajas otra vez a la vuelta, no
// pisa al de antes ni acaba en "Lisboa (1).txt".
export function nombreDeArchivo(nombre, extension, dia = hoy()) {
  return `${nombre} ${dia}.${extension}`;
}

// Bajarse el resumen en un archivo de texto, por si quieres guardarlo.
export function descargarResumen(texto, nombreViaje) {
  descargar(texto, nombreDeArchivo(nombreViaje, "txt"), "text/plain;charset=utf-8");
}

// Y los gastos en CSV. El BOM del principio es para que Excel vea las tildes.
export function descargarGastos(csv, nombreViaje) {
  descargar(`\uFEFF${csv}`, nombreDeArchivo(`${nombreViaje} - gastos`, "csv"), "text/csv;charset=utf-8");
}

// La imagen del resumen, con el menú del móvil si deja mandar archivos. Si no,
// se baja y ya la mandas tú. Devuelve "compartido", "cancelado" o "descargado".
export async function compartirImagen(imagen, nombre, nav = navigator) {
  const archivo = new File([imagen], nombre, { type: "image/png" });

  if (nav.canShare?.({ files: [archivo] })) {
    try {
      await nav.share({ files: [archivo] });
      return "compartido";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelado";
    }
  }

  descargar(imagen, nombre, "image/png");
  return "descargado";
}

// Vale con texto o con una imagen ya hecha: el Blob se traga los dos.
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
