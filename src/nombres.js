// Poner nombre a un viajero o al viaje.

// Más largo ya no cabe en las filas del resumen.
export const LARGO_MAXIMO = 40;

// "  Javier   López " se queda en "Javier López". Vacío, null.
export function limpiarNombre(texto) {
  const limpio = String(texto ?? "").replace(/\s+/g, " ").trim().slice(0, LARGO_MAXIMO).trim();
  return limpio === "" ? null : limpio;
}

const MINUSCULAS = ["de", "del", "la", "las", "los", "y"];

// "luis de la fuente" pasa a "Luis de la Fuente". Si ya lleva alguna mayúscula
// lo dejo como está: "McGregor" o "JJ" los ha escrito así a propósito.
export function conMayuscula(nombre) {
  if (nombre !== nombre.toLocaleLowerCase("es")) return nombre;

  return nombre.replace(/[^\s-]+/g, (palabra, donde) =>
    donde > 0 && MINUSCULAS.includes(palabra)
      ? palabra
      : palabra[0].toLocaleUpperCase("es") + palabra.slice(1)
  );
}

// El nombre nuevo si hay que guardarlo, o null si no hay nada que hacer:
// vacío (no se deja a nadie sin nombre) o igual que el que tenía.
export function nombreNuevo(texto, actual) {
  const limpio = limpiarNombre(texto);
  if (limpio === null || limpio === actual) return null;
  return limpio;
}

// Dos "Luis" no hay quien los distinga en el resumen, y encima salen del mismo
// color. "luis" y "Luís" también cuentan como el mismo. Devuelve el que ya estaba.
// Al renombrar a alguien, él no cuenta: de "luis" a "Luis" se puede.
export function nombreRepetido(nombre, viajeros, salvoId = null) {
  const igualar = (texto) =>
    String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const buscado = igualar(nombre);
  return viajeros.find((v) => v.id !== salvoId && igualar(v.nombre) === buscado)?.nombre ?? null;
}

// Cuántas letras hay que tocar para pasar de uno a otro. Dos cambiadas de sitio
// cuentan como una, que "Lusi" por "Luis" es la errata de siempre.
function letrasDistintas(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cambio = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cambio);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

// Mario y María, Julio y Julia: eso son dos personas, no una errata.
function soloCambiaLaO(a, b) {
  return a.slice(0, -1) === b.slice(0, -1) && /[oa]$/.test(a) && /[oa]$/.test(b);
}

// "Ana M." cuando ya está "Ana", o "Lusi" cuando está "Luis": puede ser el mismo
// metido dos veces. No se impide, se pregunta. Devuelve con quién se parece.
// Los nombres cortos no: "Ana" y "Ane" pueden ser dos personas tranquilamente.
export function nombreParecido(nombre, viajeros) {
  const igualar = (texto) =>
    String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[.]/g, "").trim();
  const buscado = igualar(nombre);
  const primera = buscado.split(/\s+/)[0];

  return (
    viajeros.find((v) => {
      const otro = igualar(v.nombre);
      if (otro === buscado) return false;
      if (otro.split(/\s+/)[0] === primera) return true;
      if (soloCambiaLaO(otro, buscado)) return false;
      return Math.min(otro.length, buscado.length) >= 4 && letrasDistintas(otro, buscado) === 1;
    })?.nombre ?? null
  );
}

export function avisoDeParecidos(parecidos) {
  if (parecidos.length === 0) return null;
  if (parecidos.length === 1) {
    const [{ nombre, conQuien }] = parecidos;
    return `¿${nombre} es otra persona? Se parece a ${conQuien}, que ya está en el viaje.`;
  }
  return `¿${enLista(parecidos.map((p) => p.nombre))} son otras personas? Se parecen a ${enLista([...new Set(parecidos.map((p) => p.conQuien))])}.`;
}

// En el campo de añadir caben varios, "Ana, Luis, Marta", así que va más largo.
export const LARGO_VARIOS = 200;

// Para meter a todo el grupo de una vez. Los que ya están (o van dos veces)
// se apartan, para dejarlos en el campo y que les pongas la inicial.
export function separarNombres(texto, viajeros) {
  const nuevos = [];
  const repetidos = [];

  // "Ana, Luis y Marta" y "Luis e Inés" también. Ojo, que "Ortega y Gasset" sale partido.
  for (const trozo of String(texto ?? "").split(/,|;|\s+[ye]\s+/i)) {
    const limpio = limpiarNombre(trozo);
    if (!limpio) continue;
    const nombre = conMayuscula(limpio);

    const yaEsta = nombreRepetido(nombre, [...viajeros, ...nuevos.map((n) => ({ nombre: n }))]);
    if (yaEsta) repetidos.push({ nombre, yaEsta });
    else nuevos.push(nombre);
  }

  return { nuevos, repetidos };
}

// Una lista pegada de WhatsApp, un nombre por línea y a veces con guiones o
// números delante, pasa a "Ana, Luis, Marta". El campo es de una línea y se
// comería los saltos: "AnaLuisMarta".
export function enUnaLinea(texto) {
  return String(texto ?? "")
    .split(/\r?\n/)
    .map((linea) => linea.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .join(", ");
}

// "Ana, Luis y Marta". Antes de sonido "i" va "e": "Luis e Inés", pero
// "Ana y Hierro", que ahí la "hi" suena "ye".
export function enLista(cosas) {
  if (cosas.length < 2) return cosas.join("");
  const ultima = cosas.at(-1);
  const y = /^h?[iíIÍ](?![aeouáéóú])/i.test(ultima) ? "e" : "y";
  return `${cosas.slice(0, -1).join(", ")} ${y} ${ultima}`;
}

// "Luis ya está en el viaje", o "Luis y Pedro ya están" si eran varios.
export function avisoDeRepetidos(nombres) {
  const unicos = [...new Set(nombres)];
  if (unicos.length === 0) return null;

  const quienes = enLista(unicos);
  const verbo = unicos.length === 1 ? "ya está" : "ya están";
  return `${quienes} ${verbo} en el viaje. Ponle la inicial del apellido para no liaros.`;
}
