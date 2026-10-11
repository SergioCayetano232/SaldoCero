// Saldar de una vez todo lo que debe alguien, que lo normal es que te haga un
// solo Bizum y no uno por persona.

import { BOTE } from "./bote";

// Solo los que deben a más de uno: con una deuda sola ya está su ✓.
// El bote no, que no paga por Bizum: lo que sobra se devuelve uno a uno.
export function deudoresConVarias(pagos) {
  const porDeudor = new Map();

  for (const pago of pagos) {
    if (pago.saldado || pago.deId === BOTE) continue;
    const clave = pago.deId ?? pago.de;
    if (!porDeudor.has(clave)) porDeudor.set(clave, { deId: pago.deId, de: pago.de, pagos: [], cantidad: 0 });
    const deudor = porDeudor.get(clave);
    deudor.pagos.push(pago);
    deudor.cantidad += pago.cantidad;
  }

  return [...porDeudor.values()].filter((d) => d.pagos.length > 1);
}
