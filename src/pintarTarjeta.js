// Pinta la tarjeta del resumen en un canvas y la devuelve como PNG.
// Los colores van a mano y no con las variables del CSS: la imagen sale
// siempre igual, tengas la app en claro o en oscuro.

import { ANCHO, ALTO_FILA, altoDeTarjeta, recortar } from "./tarjeta";
import { inicial } from "./avatares";

const TINTA = "#14262c";
const TINTA_SUAVE = "#47616b";
const TINTA_TENUE = "#7b929b";
const TEAL = "#0e7c7b";
const TEAL_FONDO = "#eef7f6";
const NARANJA = "#f4a259";
const VERDE = "#1d8a5f";
const SIN_COLOR = "#5b6f7a";

const MARGEN = 60;
const DENTRO = 72;
// Donde empieza la tarjeta blanca y lo que queda debajo para el pie.
const ARRIBA = 170;
const PIE = 140;

const fuente = (peso, tamano, familia = "Inter") => `${peso} ${tamano}px ${familia}, system-ui, sans-serif`;

export async function tarjetaEnImagen(datos, colores, pie) {
  // Si no esperamos a las fuentes, la primera vez sale con la del sistema.
  await Promise.all(
    [fuente(700, 72, "Outfit"), fuente(600, 40, "Outfit"), fuente(500, 34), fuente(600, 36)].map((f) =>
      document.fonts.load(f).catch(() => null)
    )
  );

  const alto = altoDeTarjeta(datos);
  const lienzo = document.createElement("canvas");
  lienzo.width = ANCHO;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d");

  pintarFondo(ctx, alto);
  pintarMarca(ctx);
  pintarTarjeta(ctx, alto);
  pintarCabecera(ctx, datos);
  pintarPagos(ctx, datos, colores);

  ctx.font = fuente(500, 30);
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.textAlign = "center";
  ctx.fillText(pie, ANCHO / 2, alto - 60);

  return new Promise((bien, mal) =>
    lienzo.toBlob((imagen) => (imagen ? bien(imagen) : mal(new Error("No hemos podido hacer la imagen."))), "image/png")
  );
}

function pintarFondo(ctx, alto) {
  const degradado = ctx.createLinearGradient(0, 0, ANCHO, alto);
  degradado.addColorStop(0, "#0d7473");
  degradado.addColorStop(1, "#073b3a");
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, ANCHO, alto);

  // Las mismas manchas de color que el fondo de la app.
  mancha(ctx, ANCHO * 0.9, 80, 520, "rgba(244, 162, 89, 0.55)");
  mancha(ctx, 60, alto * 0.45, 560, "rgba(52, 168, 166, 0.5)");
  mancha(ctx, ANCHO * 0.75, alto - 40, 500, "rgba(214, 122, 158, 0.4)");

  // El grano, para que no parezca una plantilla.
  const grano = document.createElement("canvas");
  grano.width = grano.height = 160;
  const g = grano.getContext("2d");
  const pixeles = g.createImageData(160, 160);
  for (let i = 0; i < pixeles.data.length; i += 4) {
    const gris = Math.random() * 255;
    pixeles.data.set([gris, gris, gris, 16], i);
  }
  g.putImageData(pixeles, 0, 0);
  ctx.fillStyle = ctx.createPattern(grano, "repeat");
  ctx.fillRect(0, 0, ANCHO, alto);
}

function mancha(ctx, x, y, radio, color) {
  const degradado = ctx.createRadialGradient(x, y, 0, x, y, radio);
  degradado.addColorStop(0, color);
  degradado.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = degradado;
  ctx.fillRect(x - radio, y - radio, radio * 2, radio * 2);
}

function pintarMarca(ctx) {
  ctx.font = fuente(700, 50, "Outfit");
  ctx.textAlign = "left";
  const saldo = ctx.measureText("Saldo").width;
  const x = (ANCHO - saldo - ctx.measureText("Cero").width) / 2;

  ctx.fillStyle = "white";
  ctx.fillText("Saldo", x, 110);
  ctx.fillStyle = NARANJA;
  ctx.fillText("Cero", x + saldo, 110);
}

function pintarTarjeta(ctx, alto) {
  const ancho = ANCHO - MARGEN * 2;
  const altoTarjeta = alto - ARRIBA - PIE;

  ctx.save();
  ctx.shadowColor = "rgba(4, 30, 30, 0.35)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.beginPath();
  ctx.roundRect(MARGEN, ARRIBA, ancho, altoTarjeta, 44);
  ctx.fill();
  ctx.restore();

  // La raya de color de arriba, como las tarjetas de la app.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(MARGEN, ARRIBA, ancho, altoTarjeta, 44);
  ctx.clip();
  const raya = ctx.createLinearGradient(MARGEN, 0, MARGEN + ancho, 0);
  raya.addColorStop(0, TEAL);
  raya.addColorStop(1, NARANJA);
  ctx.fillStyle = raya;
  ctx.fillRect(MARGEN, ARRIBA, ancho, 10);
  ctx.restore();
}

function pintarCabecera(ctx, datos) {
  const x = MARGEN + DENTRO;
  const cabe = ANCHO - (MARGEN + DENTRO) * 2;
  const medir = (t) => ctx.measureText(t).width;
  ctx.textAlign = "left";

  ctx.font = fuente(700, 72, "Outfit");
  ctx.fillStyle = TINTA;
  ctx.fillText(recortar(datos.nombre, cabe, medir), x, 300);

  if (datos.cuando) {
    ctx.font = fuente(500, 32);
    ctx.fillStyle = TINTA_TENUE;
    ctx.fillText(recortar(datos.cuando, cabe, medir), x, 352);
  }

  ctx.font = fuente(600, 26);
  ctx.fillStyle = TEAL;
  ctx.letterSpacing = "3px";
  ctx.fillText("TOTAL DEL VIAJE", x, 440);
  ctx.letterSpacing = "0px";

  ctx.font = fuente(700, 104, "Outfit");
  ctx.fillStyle = TEAL;
  ctx.fillText(recortar(datos.total, cabe, medir), x, 545);

  ctx.font = fuente(500, 32);
  ctx.fillStyle = TINTA_SUAVE;
  ctx.fillText(recortar(datos.detalle, cabe, medir), x, 600);

  ctx.fillStyle = "#e3ecee";
  ctx.fillRect(x, 648, cabe, 2);
}

function pintarPagos(ctx, datos, colores) {
  const x = MARGEN + DENTRO;
  const derecha = ANCHO - MARGEN - DENTRO;

  ctx.textAlign = "left";
  ctx.font = fuente(600, 40, "Outfit");
  ctx.fillStyle = TINTA;
  ctx.fillText(datos.estado === "pendiente" ? "Quién paga a quién" : "Cuentas", x, 720);

  if (datos.estado !== "pendiente") {
    fila(ctx, 760, "#e6f4ec");
    circulo(ctx, x + 50, 760 + 46, 30, VERDE, "✓");
    ctx.textAlign = "left";
    ctx.font = fuente(600, 36);
    ctx.fillStyle = VERDE;
    ctx.fillText(datos.estado === "pagado" ? "Todo pagado, estáis a cero" : "Nadie debe nada", x + 104, 760 + 59);
    return;
  }

  const medir = (t) => ctx.measureText(t).width;

  datos.pagos.forEach((pago, i) => {
    const y = 760 + i * ALTO_FILA;
    const centro = y + 46;
    fila(ctx, y, TEAL_FONDO);

    ctx.font = fuente(700, 40, "Outfit");
    ctx.textAlign = "right";
    ctx.fillStyle = TEAL;
    ctx.fillText(pago.cantidad, derecha - 28, centro + 14);
    const hueco = derecha - 28 - ctx.measureText(pago.cantidad).width - 30;

    // Los dos nombres se reparten lo que deja la cantidad.
    const nombre = (hueco - (x + 28) - 2 * 70 - 56) / 2;
    ctx.font = fuente(600, 34);
    ctx.textAlign = "left";

    let pos = x + 28;
    circulo(ctx, pos + 30, centro, 30, colores?.get(pago.de) ?? SIN_COLOR, inicial(pago.de));
    pos += 74;
    const de = recortar(pago.de, nombre, medir);
    ctx.font = fuente(600, 34);
    ctx.textAlign = "left";
    ctx.fillStyle = TINTA;
    ctx.fillText(de, pos, centro + 12);
    pos += medir(de) + 18;

    ctx.fillStyle = TINTA_TENUE;
    ctx.fillText("→", pos, centro + 12);
    pos += medir("→") + 18;

    circulo(ctx, pos + 30, centro, 30, colores?.get(pago.a) ?? SIN_COLOR, inicial(pago.a));
    pos += 74;
    ctx.font = fuente(600, 34);
    ctx.textAlign = "left";
    ctx.fillStyle = TINTA;
    ctx.fillText(recortar(pago.a, nombre, medir), pos, centro + 12);
  });

  if (datos.masPagos > 0) {
    ctx.font = fuente(500, 30);
    ctx.textAlign = "left";
    ctx.fillStyle = TINTA_TENUE;
    const otros = datos.masPagos === 1 ? "y 1 pago más" : `y ${datos.masPagos} pagos más`;
    ctx.fillText(`${otros}, en la app`, x + 8, 760 + datos.pagos.length * ALTO_FILA + 30);
  }
}

function fila(ctx, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(MARGEN + DENTRO - 8, y, ANCHO - (MARGEN + DENTRO) * 2 + 16, 92, 28);
  ctx.fill();
}

function circulo(ctx, x, y, radio, color, letra) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radio, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = fuente(600, 30, "Outfit");
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.fillText(letra, x, y + 11);
}
