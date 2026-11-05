// Parejas o familias que pagan juntas: Ana y Luis llevan una sola cuenta al
// saldar, así salen menos pagos. Lo de cada uno se sigue viendo por separado.

import { enLista } from "./nombres";

// Cada uno apunta con conId al que lleva la cuenta, y ese no apunta a nadie.
// Si alguien apunta a uno que ya va con otro, va por libre: así no hay cadenas
// ni círculos que resolver.
export function quienLlevaLaCuenta(viajeros) {
  const porId = new Map(viajeros.map((v) => [v.id, v]));
  return new Map(
    viajeros.map((v) => {
      const otro = v.conId && v.conId !== v.id ? porId.get(v.conId) : null;
      return [v.id, otro && !otro.conId ? otro.id : v.id];
    })
  );
}

export function vaConAlguien(viajeros) {
  const lleva = quienLlevaLaCuenta(viajeros);
  return viajeros.some((v) => lleva.get(v.id) !== v.id);
}

// Los grupos de más de uno, por el id del que lleva la cuenta. Ese va delante,
// aunque se apuntara después.
function grupos(viajeros) {
  const lleva = quienLlevaLaCuenta(viajeros);
  const porId = new Map();
  for (const v of viajeros) {
    const id = lleva.get(v.id);
    if (!porId.has(id)) porId.set(id, []);
    if (v.id === id) porId.get(id).unshift(v);
    else porId.get(id).push(v);
  }
  return new Map([...porId].filter(([, miembros]) => miembros.length > 1));
}

const nombreDelGrupo = (miembros) => enLista(miembros.map((m) => m.nombre));

// Los balances de cada grupo sumados, como si fueran uno: "Ana y Luis". El id
// es el del que lleva la cuenta, que es con el que se guardan los pagos.
export function juntarBalances(balances) {
  const deGrupo = grupos(balances);
  if (deGrupo.size === 0) return balances;

  const lleva = quienLlevaLaCuenta(balances);
  return balances.flatMap((v) => {
    const miembros = deGrupo.get(lleva.get(v.id));
    if (!miembros) return [v];
    // El grupo sale una vez, donde estaba el primero de ellos.
    if (miembros.find((m) => m.id !== v.id && balances.indexOf(m) < balances.indexOf(v))) return [];
    return [
      {
        ...miembros[0],
        nombre: nombreDelGrupo(miembros),
        balance: miembros.reduce((t, m) => t + m.balance, 0),
        ids: miembros.map((m) => m.id),
      },
    ];
  });
}

// "Ana y Luis" sale en los pagos y en el diagrama con el color de Ana.
export function conColoresDeGrupos(colores, viajeros) {
  const todos = new Map(colores);
  for (const miembros of grupos(viajeros).values()) {
    todos.set(nombreDelGrupo(miembros), colores.get(miembros[0].nombre));
  }
  return todos;
}

// Si un pago es tuyo por ir en el grupo. Sin grupo, por el id de siempre.
export function pagaYo(pago, soy) {
  return Boolean(soy) && (pago.deId === soy || Boolean(pago.deIds?.includes(soy)));
}

export function cobroYo(pago, soy) {
  return Boolean(soy) && (pago.aId === soy || Boolean(pago.aIds?.includes(soy)));
}

// Con quién va alguien, si va con alguien.
export function conQuienVa(viajero, viajeros) {
  const id = quienLlevaLaCuenta(viajeros).get(viajero.id);
  return id === viajero.id ? null : viajeros.find((v) => v.id === id);
}

// Los que van con él, si es el que lleva la cuenta.
export function losQueVanCon(viajero, viajeros) {
  const lleva = quienLlevaLaCuenta(viajeros);
  return viajeros.filter((v) => v.id !== viajero.id && lleva.get(v.id) === viajero.id);
}

// Con quién se puede juntar: con los que no van ya con otro. Y el que lleva la
// cuenta de alguien no, que entonces se quedarían colgando los suyos.
export function conQuienPuedeIr(viajero, viajeros) {
  if (losQueVanCon(viajero, viajeros).length > 0) return [];
  return viajeros.filter((v) => v.id !== viajero.id && !conQuienVa(v, viajeros));
}

// Con dos no hay nada que juntar: serían uno pagándose a sí mismo.
export const MINIMO_PARA_JUNTAR = 3;
