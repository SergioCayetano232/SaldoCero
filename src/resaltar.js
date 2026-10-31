// Marcar en la lista lo que has buscado, para ver de un vistazo por qué sale
// cada gasto. Sin mirar tildes ni mayúsculas, igual que el buscador.

import { palabrasBuscadas } from "./filtros";

// Letra a letra y sin el trim de normalizar, que aquí los espacios cuentan.
function plano(letra) {
  return letra.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

// "Cafetería", "cafe" → [{ texto: "Cafe", resaltado: true }, { texto: "tería", resaltado: false }]
export function trozosResaltados(texto, buscado) {
  const agujas = palabrasBuscadas(buscado);
  if (!texto || agujas.length === 0) return [{ texto: texto ?? "", resaltado: false }];

  // Al quitar la tilde, "é" puede ocupar distinto: guardo de qué letra viene cada trozo.
  const letras = Array.from(texto);
  let pajar = "";
  const deQueLetra = [];
  letras.forEach((letra, i) => {
    const p = plano(letra);
    pajar += p;
    for (let k = 0; k < p.length; k++) deQueLetra.push(i);
  });

  // Cada palabra por su lado, que en "cena ana" una sale en el concepto y otra en quién pagó.
  const marcada = letras.map(() => false);
  for (const aguja of agujas) {
    let donde = pajar.indexOf(aguja);
    while (donde !== -1) {
      for (let i = deQueLetra[donde]; i <= deQueLetra[donde + aguja.length - 1]; i++) marcada[i] = true;
      donde = pajar.indexOf(aguja, donde + aguja.length);
    }
  }

  const trozos = [];
  letras.forEach((letra, i) => {
    const ultimo = trozos.at(-1);
    if (ultimo && ultimo.resaltado === marcada[i]) ultimo.texto += letra;
    else trozos.push({ texto: letra, resaltado: marcada[i] });
  });

  return trozos;
}
