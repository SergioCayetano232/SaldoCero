// El service worker: lo justo para que la app abra sin conexión.
//
// Guardamos el armazón (html, js, css) y lo servimos de ahí. Los datos NO se
// guardan: un viaje lo van tocando varios a la vez, y enseñarte una versión
// vieja de las cuentas sería peor que decirte que no hay internet.

const CACHE = "saldocero-v1";

// Lo mínimo para que la app arranque.
const ARMAZON = ["/", "/index.html", "/manifest.json", "/favicon.svg"];

self.addEventListener("install", (evento) => {
  // Que el nuevo entre en cuanto esté, sin esperar a que cierres las pestañas.
  self.skipWaiting();
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARMAZON)).catch(() => {})
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

// La foto de un ticket compartida desde la galería. El móvil la manda por POST
// y aquí no hay servidor que la reciba: la dejamos en una caché aparte y la app
// la recoge al abrirse. Los nombres van igual en src/llegada.js.
const CACHE_COMPARTIDO = "saldocero-compartido";
const RUTA_TICKET = "/ticket-compartido";

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;

  if (peticion.method === "POST" && new URL(peticion.url).pathname === "/compartir-ticket") {
    evento.respondWith(recibirTicket(peticion));
    return;
  }

  // Solo nos metemos en lo nuestro y en lecturas.
  if (peticion.method !== "GET") return;
  if (new URL(peticion.url).origin !== self.location.origin) return;

  // Al navegar: intentamos la red y, si no hay, tiramos de lo guardado.
  if (peticion.mode === "navigate") {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          guardar(peticion, respuesta.clone());
          return respuesta;
        })
        .catch(() => caches.match("/index.html").then((r) => r ?? Response.error()))
    );
    return;
  }

  // Para el resto (js, css, iconos): lo guardado va primero, que es más rápido,
  // y de fondo lo vamos refrescando.
  evento.respondWith(
    caches.match(peticion).then((guardado) => {
      const red = fetch(peticion)
        .then((respuesta) => {
          guardar(peticion, respuesta.clone());
          return respuesta;
        })
        .catch(() => guardado);

      return guardado ?? red;
    })
  );
});

async function recibirTicket(peticion) {
  try {
    const foto = (await peticion.formData()).get("ticket");
    if (foto && foto.type.startsWith("image/")) {
      const cache = await caches.open(CACHE_COMPARTIDO);
      await cache.put(RUTA_TICKET, new Response(foto, { headers: { "Content-Type": foto.type } }));
    }
  } catch {
    // Si no se puede leer, la app se abre igual, solo que sin la foto.
  }
  return Response.redirect("/?ticket", 303);
}

function guardar(peticion, respuesta) {
  if (!respuesta || respuesta.status !== 200) return;
  caches.open(CACHE).then((cache) => cache.put(peticion, respuesta)).catch(() => {});
}
