import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { usarIdioma, idiomaGuardado, idiomaDelMovil } from './idioma'
import { ponerDiscreto } from './discreto'
import { leerDiscreto } from './datos'
import { seguirLaLuz } from './luz'
import { ondearBotones } from './onda'

// Antes de pintar nada, que no se vea un momento en el otro idioma.
usarIdioma(idiomaGuardado() ?? idiomaDelMovil(navigator.languages))
ponerDiscreto(leerDiscreto())
seguirLaLuz()
ondearBotones()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Que la app se pueda instalar y abra sin conexión.
// Solo en producción: en desarrollo estorba, porque te sirve versiones viejas.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Si no se puede registrar, la app funciona igual. No hay nada que decir.
    });
  });
}
