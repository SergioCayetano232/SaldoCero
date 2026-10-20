// Quién paga a quién, dibujado: los que deben a la izquierda, los que cobran a
// la derecha y una flecha por pago, más gorda cuanto más dinero.
// Aquí solo las cuentas de dónde va cada cosa; el SVG lo pinta el componente.

export const ANCHO = 320;
export const FILA = 76;
export const RADIO = 17;
const ARRIBA = 30;
const X_DEBEN = 62;
const X_COBRAN = ANCHO - 62;
// Hasta dónde llega la flecha, que no se meta en el círculo.
const HUECO = RADIO + 7;
const GROSOR_MIN = 2;
const GROSOR_MAX = 9;
// Si a uno le llegan o le salen varias, se abren un poco para no hacer un borrón.
const ABANICO = 9;
// Lo que ocupa la cifra de cada flecha, para que no se pisen.
const ETIQUETA = { ancho: 62, alto: 22 };

// Por orden de aparición: el primero en deber, arriba.
function columna(pagos, id, nombre) {
  const vistos = new Map();
  for (const pago of pagos) {
    if (!vistos.has(pago[id])) vistos.set(pago[id], { id: pago[id], nombre: pago[nombre] });
  }
  return [...vistos.values()];
}

// Un punto de la curva, de 0 (sale) a 1 (llega).
export function puntoDeCurva(desde, hasta, t) {
  const medio = (desde.x + hasta.x) / 2;
  const [x0, x1, x2, x3] = [desde.x, medio, medio, hasta.x];
  const [y0, y1, y2, y3] = [desde.y, desde.y, hasta.y, hasta.y];
  const u = 1 - t;
  const b = (p0, p1, p2, p3) => u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  return { x: b(x0, x1, x2, x3), y: b(y0, y1, y2, y3) };
}

function sePisan(a, b) {
  return Math.abs(a.x - b.x) < ETIQUETA.ancho && Math.abs(a.y - b.y) < ETIQUETA.alto + 2;
}

// Cada cifra en mitad de su flecha. Si ahí ya hay otra, un poco antes o después.
const SITIOS = [0.5, 0.36, 0.64, 0.26, 0.74];

export function diagramaDeDeudas(pagos) {
  const quedan = pagos.filter((p) => !p.saldado);
  const deben = columna(quedan, "deId", "de");
  const cobran = columna(quedan, "aId", "a");
  const filas = Math.max(deben.length, cobran.length);
  const alto = ARRIBA * 2 + Math.max(0, filas - 1) * FILA + 26;

  // La columna corta, centrada con la larga.
  const colocar = (lista, x) => {
    const sobra = ((filas - lista.length) * FILA) / 2;
    return lista.map((p, i) => ({ ...p, x, y: ARRIBA + sobra + i * FILA }));
  };
  const izquierda = colocar(deben, X_DEBEN);
  const derecha = colocar(cobran, X_COBRAN);

  const max = Math.max(0, ...quedan.map((p) => p.cantidad));
  const puestas = [];

  const desplazar = (pago, campo) => {
    const suyos = quedan.filter((p) => p[campo] === pago[campo]);
    const i = suyos.indexOf(pago);
    const paso = Math.min(ABANICO, (RADIO * 1.4) / suyos.length);
    return (i - (suyos.length - 1) / 2) * paso;
  };

  const flechas = quedan.map((pago) => {
    const de = izquierda.find((p) => p.id === pago.deId);
    const a = derecha.find((p) => p.id === pago.aId);
    const desde = { x: de.x + RADIO + 3, y: de.y + desplazar(pago, "deId") };
    const hasta = { x: a.x - HUECO, y: a.y + desplazar(pago, "aId") };

    const candidatos = SITIOS.map((t) => puntoDeCurva(desde, hasta, t));
    const etiqueta = candidatos.find((c) => !puestas.some((p) => sePisan(p, c))) ?? candidatos[0];
    puestas.push(etiqueta);

    return {
      deId: pago.deId,
      aId: pago.aId,
      cantidad: pago.cantidad,
      desde,
      hasta,
      grosor: max > 0 ? GROSOR_MIN + ((GROSOR_MAX - GROSOR_MIN) * pago.cantidad) / max : GROSOR_MIN,
      etiqueta,
    };
  });

  return { ancho: ANCHO, alto, deben: izquierda, cobran: derecha, flechas, etiqueta: ETIQUETA };
}

// El camino de la flecha en SVG: sale y llega en horizontal.
export function caminoDeFlecha({ desde, hasta }) {
  const medio = (desde.x + hasta.x) / 2;
  return `M ${desde.x} ${desde.y} C ${medio} ${desde.y}, ${medio} ${hasta.y}, ${hasta.x} ${hasta.y}`;
}

// Con uno solo, la lista ya lo dice todo.
export function hayDiagrama(pagos) {
  return pagos.filter((p) => !p.saldado).length >= 2;
}
