// El título de la pestaña. Con varias abiertas, o con la app instalada en el
// selector de apps, así sabes en qué viaje estás.

export const TITULO_SIN_VIAJE = "SaldoCero · Reparte los gastos del viaje";

export function tituloDePestana(nombreDelViaje) {
  const nombre = nombreDelViaje?.trim();
  return nombre ? `${nombre} · SaldoCero` : TITULO_SIN_VIAJE;
}
