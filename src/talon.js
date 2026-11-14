// El talón de arriba: lo que debes (o te deben) y a quién le toca pagar.
// Son las mismas cuentas que el resumen, con los pagos ya hechos descontados,
// para que arriba y abajo nunca digan cosas distintas.

import { sinBote } from "./bote";
import { balancesTrasPagos, calcularLeTocaPagar, pagosDelViaje } from "./calculos";
import { miSaldo } from "./miSaldo";

const CENTIMO = 0.005;

export function datosDelTalon(balances, viaje, soy, { cerrado = false } = {}) {
  const personas = sinBote(balances);
  const pagos = pagosDelViaje(balances, viaje);
  const pendientes = pagos.filter((p) => !p.saldado).length;

  return {
    saldo: saldoDelTalon(personas, pagos, soy),
    // Cerrado ya no hay próxima; y sin gastos, tampoco hay a quién.
    toca: cerrado || viaje.gastos.length === 0 ? null : tocaDelTalon(calcularLeTocaPagar(balancesTrasPagos(personas, pagos)), soy),
    pendientes,
  };
}

function saldoDelTalon(personas, pagos, soy) {
  if (!soy || !personas.some((v) => v.id === soy)) return { tipo: "sin-ti" };
  const { debes, teDeben, tenias } = miSaldo(pagos, soy);
  if (debes > CENTIMO) return { tipo: "debes", cifra: debes, ademas: teDeben > CENTIMO ? teDeben : 0 };
  if (teDeben > CENTIMO) return { tipo: "te-deben", cifra: teDeben };
  return { tipo: tenias ? "pagado" : "a-cero" };
}

function tocaDelTalon(leToca, soy) {
  if (!leToca) return null;
  if (leToca.igualados) return { tipo: "cualquiera" };
  if (leToca.id === soy) return { tipo: "tu" };
  return { tipo: "otro", nombre: leToca.nombre };
}
