// La categoría que pega con lo que escribes en el concepto, para no tener que
// elegirla a mano en lo de siempre: "taxi", "cena", "hotel"...

import { normalizar } from "./filtros";

// Sin tildes y en minúscula, que es como se comparan.
const PALABRAS = {
  comida: [
    "cena", "comida", "almuerzo", "desayuno", "merienda", "aperitivo", "vermut",
    "tapas", "tapa", "pinchos", "restaurante", "bar", "cafe", "cafeteria", "cerveza",
    "cervezas", "copa", "copas", "vino", "pizza", "hamburguesa", "kebab", "helado",
    "helados", "super", "supermercado", "mercadona", "carrefour", "lidl",
    "mercado", "panaderia", "churros", "bocadillo", "bocadillos", "menu", "sushi",
  ],
  transporte: [
    "taxi", "uber", "cabify", "bolt", "gasolina", "gasoil", "diesel", "combustible",
    "peaje", "peajes", "parking", "aparcamiento", "autobus", "bus", "metro", "tren",
    "renfe", "ave", "avion", "vuelo", "vuelos", "billete", "billetes", "ferry",
    "barco", "coche", "tranvia", "bici", "patinete",
  ],
  alojamiento: [
    "hotel", "hostal", "airbnb", "apartamento", "casa", "camping", "albergue",
    "booking", "habitacion", "pension", "cabana",
  ],
  ocio: [
    "entrada", "entradas", "museo", "concierto", "discoteca", "fiesta", "cine",
    "teatro", "excursion", "tour", "visita", "guia", "parque", "kayak", "surf",
    "spa", "bolos", "karaoke", "partido", "festival",
  ],
  compras: [
    "regalo", "regalos", "souvenir", "souvenirs", "recuerdo", "recuerdos", "ropa",
    "tienda", "farmacia", "crema", "imanes", "iman",
  ],
};

// De palabra a categoría, que buscar así es directo.
const CATEGORIA_DE = new Map(
  Object.entries(PALABRAS).flatMap(([id, palabras]) => palabras.map((p) => [normalizar(p), id]))
);

// Manda la primera palabra que se reconoce: "cena en el hotel" es comida, y
// "taxi al restaurante", transporte. null si no hay ninguna.
export function adivinarCategoria(concepto) {
  const palabras = normalizar(concepto).split(/[^a-z0-9]+/);

  for (const palabra of palabras) {
    // En plural también: "cafés", "taxis", "hoteles".
    const id =
      CATEGORIA_DE.get(palabra) ??
      CATEGORIA_DE.get(palabra.replace(/s$/, "")) ??
      CATEGORIA_DE.get(palabra.replace(/es$/, ""));
    if (id) return id;
  }

  return null;
}
