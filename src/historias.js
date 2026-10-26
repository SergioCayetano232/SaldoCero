// El viaje contado en historias, una cifra por pantalla, como las de Instagram.
// Sale de las cifras del viaje: solo cuenta lo que esas dicen que merece la pena.

import { conMoneda } from "./monedas";
import { cuandoFue } from "./fechas";

// Lo que dura cada una antes de pasar sola.
export const DURA_CADA_UNA = 5000;

function enLargo(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const veces = (n) => (n === 1 ? "1 vez" : `${n} veces`);

export function historiasDelViaje(cifras, { nombre, moneda, gastos, pendientes }) {
  if (!cifras) return [];
  const dinero = (x) => conMoneda(x, moneda);
  const lista = [];

  lista.push({
    id: "inicio",
    emoji: "🧳",
    antes: "Así fue",
    cifra: nombre,
    despues: cuandoFue(gastos.map((g) => g.fecha)) ?? "",
  });

  lista.push({
    id: "total",
    emoji: "💸",
    antes: "Entre todos os gastasteis",
    cifra: dinero(cifras.total),
    despues: `en ${cifras.gastos === 1 ? "1 gasto" : `${cifras.gastos} gastos`}${cifras.dias > 1 ? ` y ${cifras.dias} días` : ""}`,
  });

  if (cifras.porPersonaYDia !== null) {
    lista.push({
      id: "por-dia",
      emoji: "🧍",
      antes: "A cada uno le salió",
      cifra: dinero(cifras.porPersonaYDia),
      despues: "por día, de media",
    });
  }

  if (cifras.categoria) {
    lista.push({
      id: "categoria",
      emoji: cifras.categoria.emoji,
      antes: "Lo que más tirasteis",
      cifra: `${cifras.categoria.porcentaje} %`,
      despues: `se fue en ${cifras.categoria.nombre.toLowerCase()}`,
    });
  }

  if (cifras.diaMasCaro) {
    lista.push({
      id: "dia-caro",
      emoji: "📅",
      antes: "El día que más se fue",
      cifra: enLargo(cifras.diaMasCaro.fecha),
      despues: dinero(cifras.diaMasCaro.total),
    });
  }

  const grande = cifras.gastoMasGrande;
  lista.push({
    id: "grande",
    emoji: "💎",
    antes: "Lo más gordo",
    cifra: grande.concepto,
    despues: grande.quien ? `${dinero(grande.importe)}, y lo pagó ${grande.quien}` : dinero(grande.importe),
  });

  if (cifras.masRepetido) {
    lista.push({
      id: "repetido",
      emoji: "🔁",
      antes: "Lo que no faltó",
      cifra: cifras.masRepetido.concepto,
      despues: `${veces(cifras.masRepetido.veces)}, ${dinero(cifras.masRepetido.total)} en total`,
    });
  }

  if (cifras.quienMasPuso) {
    lista.push({
      id: "mas-puso",
      emoji: "🏆",
      antes: "Quien más puso",
      cifra: cifras.quienMasPuso.nombre,
      despues: dinero(cifras.quienMasPuso.puesto),
    });
  }

  // Si es el mismo que más puso, ya ha tenido su momento.
  if (cifras.quienMasVeces && cifras.quienMasVeces.id !== cifras.quienMasPuso?.id) {
    lista.push({
      id: "mas-veces",
      emoji: "👛",
      antes: "Quien más veces sacó la cartera",
      cifra: cifras.quienMasVeces.nombre,
      despues: veces(cifras.quienMasVeces.veces),
    });
  }

  lista.push(
    pendientes === 0
      ? { id: "final", emoji: "🎉", antes: "Y lo mejor", cifra: "Estáis a cero", despues: "Nadie le debe nada a nadie" }
      : {
          id: "final",
          emoji: "🤝",
          antes: "Para quedar a cero",
          cifra: pendientes === 1 ? "Falta 1 pago" : `Faltan ${pendientes} pagos`,
          despues: "En el resumen tenéis quién paga a quién",
        }
  );

  return lista;
}

// A cuál ir al tocar: la mitad izquierda vuelve, la derecha avanza. null es salir.
export function siguienteHistoria(actual, total, haciaAtras) {
  if (haciaAtras) return Math.max(0, actual - 1);
  return actual + 1 < total ? actual + 1 : null;
}

// Inicio y Fin, como en una lista: a la primera o a la última. Otra tecla, null.
export function historiaDelExtremo(tecla, total) {
  if (tecla === "Home") return 0;
  if (tecla === "End") return total - 1;
  return null;
}
