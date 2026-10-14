// Marcar en la lista lo que has buscado, para ver de un vistazo por qué sale
// cada gasto. Sin mirar tildes ni mayúsculas, igual que el buscador.

import { normalizar } from "./filtros";

// Letra a letra y sin el trim de normalizar, que aquí los espacios cuentan.
function plano(letra) {
  return letra.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

// "Cafetería", "cafe" → [{ texto: "Cafe", resaltado: true }, { texto: "tería", resaltado: false }]
export function trozosResaltados(texto, buscado) {
  const aguja = normalizar(buscado);
  if (!texto || !aguja) return [{ texto: texto ?? "", resaltado: false }];

  // Al quitar la tilde, "é" puede ocupar distinto: guardo de qué letra viene cada trozo.
  const letras = Array.from(texto);
  let pajar = "";
  const deQueLetra = [];
  letras.forEach((letra, i) => {
    const p = plano(letra);
    pajar += p;
    for (let k = 0; k < p.length; k++) deQueLetra.push(i);
  });

  const trozos = [];
  let desde = 0;
  let donde = pajar.indexOf(aguja);
  while (donde !== -1) {
    const ini = deQueLetra[donde];
    const fin = deQueLetra[donde + aguja.length - 1] + 1;
    if (ini > desde) trozos.push({ texto: letras.slice(desde, ini).join(""), resaltado: false });
    trozos.push({ texto: letras.slice(ini, fin).join(""), resaltado: true });
    desde = fin;
    donde = pajar.indexOf(aguja, donde + aguja.length);
  }
  if (desde < letras.length) trozos.push({ texto: letras.slice(desde).join(""), resaltado: false });

  return trozos;
}
