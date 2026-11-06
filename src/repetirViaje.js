// Otro viaje con la misma gente: el finde de la cuadrilla, el de cada verano...

import { BOTE } from "./bote";
import { POR_DEFECTO } from "./categorias";
import { conMoneda } from "./monedas";

// "Ibiza" → "Ibiza 2", "Ibiza 2" → "Ibiza 3". Y si acaba en un año, el siguiente,
// que "Ibiza 2026 2" no lo escribe nadie.
export function nombreDeLaRepeticion(nombre) {
  const limpio = nombre.trim();
  const numero = limpio.match(/^(.*?)\s*(\d+)$/);

  if (numero && numero[1]) {
    const n = Number(numero[2]);
    const esAno = numero[2].length === 4 && n >= 1900 && n < 2200;
    if (esAno || n < 100) return `${numero[1]} ${n + 1}`;
  }

  return `${limpio} 2`;
}

// Quién pasa al nuevo: los mismos, con su Bizum o IBAN, que no habrá cambiado.
export function genteParaRepetir(viajeros) {
  return viajeros.map((v) => ({ nombre: v.nombre, cobro: v.cobro ?? null }));
}

// Tú en el viaje nuevo. Va por nombre, que los ids son otros.
export function quienEresEnElNuevo(soy, viejos, nuevos) {
  const nombre = viejos.find((v) => v.id === soy)?.nombre;
  return nuevos.find((v) => v.nombre === nombre)?.id ?? null;
}

function enCentimos(n) {
  return Math.round(n * 100) / 100;
}

// Lo que quedó sin pagar y se puede llevar al nuevo. Lo del bote no: el bote
// es de aquel viaje y en el nuevo empieza vacío.
export function pendientesParaPasar(pagos) {
  return pagos.filter((p) => !p.saldado && p.cantidad > 0 && p.deId !== BOTE && p.aId !== BOTE);
}

// Cada deuda va al nuevo como un gasto que pagó el que cobra y es solo del que
// debe: así el balance sale igual que estaba, sin tocar las cuentas.
export function gastosDeLoPendiente(pendientes, viejos, nuevos, { nombre, moneda, dia }) {
  const enElNuevo = (id) => {
    const suNombre = viejos.find((v) => v.id === id)?.nombre;
    return nuevos.find((v) => v.nombre === suNombre)?.id ?? null;
  };

  return pendientes.flatMap((pago) => {
    const deudor = enElNuevo(pago.deId);
    const acreedor = enElNuevo(pago.aId);
    if (!deudor || !acreedor) return [];

    const importe = enCentimos(pago.cantidad);
    const gasto = {
      pagadorId: acreedor,
      importe,
      moneda,
      importeConvertido: importe,
      concepto: `Lo que quedó de ${nombre}`,
      categoria: POR_DEFECTO,
      fecha: dia,
      nota: `${pago.de} le debía esto a ${pago.a}`,
      participantes: [deudor],
      partes: null,
    };
    return [{ pago, gasto }];
  });
}

export function preguntaDePendientes(pendientes, nombreNuevo, moneda) {
  if (pendientes.length === 1) {
    const [p] = pendientes;
    return `Queda una deuda sin pagar: ${p.de} le debe ${conMoneda(enCentimos(p.cantidad), moneda)} a ${p.a}. ¿La pasamos a "${nombreNuevo}"? Allí saldrá como un gasto y aquí se dará por pagada.`;
  }

  // Con lo redondeado, que es lo que pasa al nuevo.
  const total = pendientes.reduce((t, p) => t + enCentimos(p.cantidad), 0);
  return `Quedan ${pendientes.length} deudas sin pagar, ${conMoneda(total, moneda)} en total. ¿Las pasamos a "${nombreNuevo}"? Allí saldrán como gastos y aquí se darán por pagadas.`;
}
