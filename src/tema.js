// Claro, oscuro o lo que diga el móvil. Por defecto, lo del móvil.

export const TEMAS = [
  { id: "auto", nombre: "Automático", icono: "🌓" },
  { id: "claro", nombre: "Claro", icono: "☀️" },
  { id: "oscuro", nombre: "Oscuro", icono: "🌙" },
];

// Lo que haya guardado, si es uno de los nuestros.
export function temaGuardado(valor) {
  return TEMAS.some((t) => t.id === valor) ? valor : "auto";
}

export function siguienteTema(id) {
  const i = TEMAS.findIndex((t) => t.id === id);
  return TEMAS[(i + 1) % TEMAS.length].id;
}

export function temaDe(id) {
  return TEMAS.find((t) => t.id === id) ?? TEMAS[0];
}

// El que se pinta de verdad. Esto mismo va repetido en index.html, para
// ponerlo antes de que cargue nada.
export function temaQueToca(id, sistemaOscuro) {
  if (id === "claro" || id === "oscuro") return id;
  return sistemaOscuro ? "oscuro" : "claro";
}
