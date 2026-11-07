// El viaje contado en historias, una cifra por pantalla, como las de Instagram.
// Sale de las cifras del viaje: solo cuenta lo que esas dicen que merece la pena.

import { conMoneda } from "./monedas";
import { cuandoFue } from "./fechas";
import { t, tn, formatoFechas } from "./idioma";

// Lo que dura cada una antes de pasar sola.
export const DURA_CADA_UNA = 5000;

function enLargo(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString(formatoFechas(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const veces = (n) => tn(n, "{n} vez", "{n} veces");

export function historiasDelViaje(cifras, { nombre, moneda, gastos, pendientes }) {
  if (!cifras) return [];
  const dinero = (x) => conMoneda(x, moneda);
  const lista = [];

  lista.push({
    id: "inicio",
    emoji: "🧳",
    antes: t("Así fue"),
    cifra: nombre,
    despues: cuandoFue(gastos.map((g) => g.fecha)) ?? "",
  });

  lista.push({
    id: "total",
    emoji: "💸",
    antes: t("Entre todos os gastasteis"),
    cifra: dinero(cifras.total),
    despues: `${tn(cifras.gastos, "en {n} gasto", "en {n} gastos")}${cifras.dias > 1 ? ` ${t("y {n} días", { n: cifras.dias })}` : ""}`,
  });

  if (cifras.porPersonaYDia !== null) {
    lista.push({
      id: "por-dia",
      emoji: "🧍",
      antes: t("A cada uno le salió"),
      cifra: dinero(cifras.porPersonaYDia),
      despues: t("por día, de media"),
    });
  }

  if (cifras.categoria) {
    lista.push({
      id: "categoria",
      emoji: cifras.categoria.emoji,
      antes: t("Lo que más tirasteis"),
      cifra: t("{n} %", { n: cifras.categoria.porcentaje }),
      despues: t("se fue en {categoria}", { categoria: t(cifras.categoria.nombre).toLowerCase() }),
    });
  }

  if (cifras.diaMasCaro) {
    lista.push({
      id: "dia-caro",
      emoji: "📅",
      antes: t("El día que más se fue"),
      cifra: enLargo(cifras.diaMasCaro.fecha),
      despues: dinero(cifras.diaMasCaro.total),
    });
  }

  const grande = cifras.gastoMasGrande;
  lista.push({
    id: "grande",
    emoji: "💎",
    antes: t("Lo más gordo"),
    cifra: grande.concepto,
    despues: grande.quien ? t("{cifra}, y lo pagó {quien}", { cifra: dinero(grande.importe), quien: grande.quien }) : dinero(grande.importe),
  });

  if (cifras.masRepetido) {
    lista.push({
      id: "repetido",
      emoji: "🔁",
      antes: t("Lo que no faltó"),
      cifra: cifras.masRepetido.concepto,
      despues: t("{veces}, {cifra} en total", { veces: veces(cifras.masRepetido.veces), cifra: dinero(cifras.masRepetido.total) }),
    });
  }

  if (cifras.quienMasPuso) {
    lista.push({
      id: "mas-puso",
      emoji: "🏆",
      antes: t("Quien más puso"),
      cifra: cifras.quienMasPuso.nombre,
      despues: dinero(cifras.quienMasPuso.puesto),
    });
  }

  // Si es el mismo que más puso, ya ha tenido su momento.
  if (cifras.quienMasVeces && cifras.quienMasVeces.id !== cifras.quienMasPuso?.id) {
    lista.push({
      id: "mas-veces",
      emoji: "👛",
      antes: t("Quien más veces sacó la cartera"),
      cifra: cifras.quienMasVeces.nombre,
      despues: veces(cifras.quienMasVeces.veces),
    });
  }

  lista.push(
    pendientes === 0
      ? { id: "final", emoji: "🎉", antes: t("Y lo mejor"), cifra: t("Estáis a cero"), despues: t("Nadie le debe nada a nadie") }
      : {
          id: "final",
          emoji: "🤝",
          antes: t("Para quedar a cero"),
          cifra: tn(pendientes, "Falta {n} pago", "Faltan {n} pagos"),
          despues: t("En el resumen tenéis quién paga a quién"),
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
