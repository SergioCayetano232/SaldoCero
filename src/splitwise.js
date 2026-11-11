// Traerse los gastos de un grupo de Splitwise, para cambiarse a mitad de viaje
// sin volver a teclearlo todo. Se pega el CSV que exporta, o se elige el archivo.
//
// Splitwise no dice quién pagó ni cuánto le toca a cada uno: trae una columna por
// persona con lo que ese gasto le deja a favor (+) o en contra (−). Con eso basta.

import { adivinarCategoria } from "./adivinar";
import { POR_DEFECTO } from "./categorias";
import { arreglarConcepto } from "./concepto";
import { pagadorPrincipal } from "./pagadores";
import { nombreRepetido } from "./nombres";
import { tn } from "./idioma";

const FIJAS = ["date", "description", "category", "cost", "currency", "details", "receipt link", "deleted by"];

// Los céntimos sueltos, de redondear en Splitwise.
const MARGEN = 0.011;

// Comas dentro de comillas y comillas dobles escapadas, que las descripciones las traen.
function filas(texto) {
  const salida = [];
  let fila = [];
  let campo = "";
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') entreComillas = false;
      else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo);
      salida.push(fila);
      fila = [];
      campo = "";
    } else campo += c;
  }
  fila.push(campo);
  salida.push(fila);

  return salida.filter((f) => f.some((c) => c.trim()));
}

function cabecera(texto) {
  return (filas(String(texto ?? "").replace(/^\uFEFF/, ""))[0] ?? []).map((c) => c.trim().toLowerCase());
}

export function esDeSplitwise(texto) {
  const columnas = cabecera(texto);
  return ["date", "description", "cost", "currency"].every((c) => columnas.includes(c));
}

function cifra(texto) {
  const n = Number(String(texto ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

const centimos = (n) => Math.round(n * 100);

// Lo que da cada fila. Los pagos entre vosotros ("Luis le dio 20 a Ana") también
// entran: un gasto de 20 que paga Luis y es solo de Ana deja las cuentas igual.
function gastoDeFila(fila, columnas, personas, moneda) {
  const valor = (nombre) => fila[columnas.indexOf(nombre)]?.trim() ?? "";
  const descripcion = valor("description");
  const coste = cifra(valor("cost"));

  if (!/^\d{4}-\d{2}-\d{2}/.test(valor("date")) || !coste || coste <= 0) return null;
  if (valor("currency").toUpperCase() !== moneda) return { fuera: descripcion };

  const netos = personas.map((p) => ({ id: p.id, neto: cifra(fila[p.columna]) ?? 0 }));
  if (Math.abs(netos.reduce((t, p) => t + p.neto, 0)) > MARGEN * personas.length) return { fuera: descripcion };

  const ponen = netos.filter((p) => p.neto > MARGEN);
  if (ponen.length === 0) return { fuera: descripcion };

  let importe = coste;
  let pagadores = null;
  let partes;

  if (ponen.length === 1) {
    // Uno pagó todo: a los demás les toca lo que deben, y a él lo que sobra.
    const pagador = ponen[0];
    partes = Object.fromEntries(
      netos.map((p) => [p.id, p.id === pagador.id ? centimos(coste - p.neto) : centimos(-p.neto)]).filter(([, c]) => c > 0)
    );
  } else {
    // Pagaron varios y no se sabe lo de cada uno, solo cómo quedan. Se apunta
    // lo que movió dinero de verdad, que deja las cuentas igual.
    pagadores = Object.fromEntries(ponen.map((p) => [p.id, centimos(p.neto)]));
    partes = Object.fromEntries(netos.filter((p) => p.neto < -MARGEN).map((p) => [p.id, centimos(-p.neto)]));
    importe = Object.values(pagadores).reduce((t, c) => t + c, 0) / 100;
  }

  const participantes = Object.keys(partes);
  if (participantes.length === 0) return { fuera: descripcion };
  // Un céntimo de diferencia es el redondeo de partir 10 entre 3: eso es a partes iguales.
  const cuanto = Object.values(partes);
  const iguales = Math.max(...cuanto) - Math.min(...cuanto) <= 1;

  const categoria = adivinarCategoria(`${valor("category")} ${descripcion}`) ?? POR_DEFECTO;
  return {
    gasto: {
      pagadorId: pagadores ? pagadorPrincipal(pagadores) : ponen[0].id,
      pagadores,
      importe,
      moneda,
      importeConvertido: importe,
      concepto: arreglarConcepto(descripcion || valor("category") || "Gasto"),
      categoria,
      fecha: valor("date").slice(0, 10),
      nota: valor("details") || null,
      participantes,
      partes: iguales ? null : partes,
    },
  };
}

// Lo mismo que da pegar una lista: { gastos, sinEntender }, más los que vienen
// en Splitwise y aquí no están, que hay que añadir antes.
export function gastosDeSplitwise(texto, viajeros, moneda = "EUR") {
  const todas = filas(String(texto ?? "").replace(/^\uFEFF/, ""));
  const columnas = todas[0].map((c) => c.trim().toLowerCase());

  const personas = [];
  const faltan = [];
  todas[0].forEach((nombre, columna) => {
    if (FIJAS.includes(nombre.trim().toLowerCase()) || !nombre.trim()) return;
    const igual = nombreRepetido(nombre, viajeros);
    if (igual) personas.push({ id: viajeros.find((v) => v.nombre === igual).id, columna });
    else faltan.push(nombre.trim());
  });

  if (faltan.length > 0) return { gastos: [], sinEntender: [], faltan };

  const gastos = [];
  const sinEntender = [];
  for (const fila of todas.slice(1)) {
    const salio = gastoDeFila(fila, columnas, personas, moneda);
    if (salio?.gasto) gastos.push(salio.gasto);
    // La de "Total balance" no tiene fecha y se va sin decir nada.
    else if (salio?.fuera) sinEntender.push(salio.fuera);
  }

  return { gastos, sinEntender, faltan };
}

export function textoDeSplitwise(cuantos) {
  return tn(cuantos, "De Splitwise sale 1 gasto:", "De Splitwise salen {n} gastos:");
}
