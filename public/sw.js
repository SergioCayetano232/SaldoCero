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

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;

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

function guardar(peticion, respuesta) {
  if (!respuesta || respuesta.status !== 200) return;
  caches.open(CACHE).then((cache) => cache.put(peticion, respuesta)).catch(() => {});
}
