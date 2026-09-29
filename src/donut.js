// Las cuentas del gráfico de en qué se va el dinero.

function sumar(cantidades) {
  return cantidades.reduce((t, c) => t + c, 0);
}

// Porcentajes enteros que sumen 100. Redondeando cada uno por su lado sale a
// veces 99 o 101, y eso en un gráfico de partes de un todo canta mucho.
export function porcentajes(cantidades) {
  const total = sumar(cantidades);
  if (total <= 0) return cantidades.map(() => 0);

  const exactos = cantidades.map((c) => (c * 100) / total);
  const enteros = exactos.map(Math.floor);
  let faltan = 100 - sumar(enteros);

  // Los puntos que faltan, para los que más perdieron al redondear.
  const porResto = exactos
    .map((e, i) => ({ i, resto: e - enteros[i] }))
    .sort((a, b) => b.resto - a.resto);

  for (const { i } of porResto) {
    if (faltan <= 0) break;
    enteros[i]++;
    faltan--;
  }

  return enteros;
}

// Dónde empieza y cuánto mide cada trozo, en grados desde arriba.
// Entre trozo y trozo se deja un hueco, que si no los colores se pegan.
export function trozosDelDonut(cantidades, hueco = 0) {
  const total = sumar(cantidades);
  if (total <= 0) return [];

  // Con uno solo no hay nada que separar: el anillo entero.
  const conHueco = cantidades.filter((c) => c > 0).length > 1;
  let inicio = 0;

  return cantidades.map((c) => {
    const angulo = (c / total) * 360;
    const trozo = conHueco
      ? { inicio: inicio + hueco / 2, angulo: Math.max(angulo - hueco, 0) }
      : { inicio, angulo };

    inicio += angulo;
    return trozo;
  });
}

// El punto medio del trozo, para poner ahí el emoji. En grados desde arriba y
// en el sentido del reloj, como se dibuja el donut.
export function puntoMedio(trozo, centro, radio) {
  const rad = ((trozo.inicio + trozo.angulo / 2) * Math.PI) / 180;

  return {
    x: centro + radio * Math.sin(rad),
    y: centro - radio * Math.cos(rad),
  };
}
