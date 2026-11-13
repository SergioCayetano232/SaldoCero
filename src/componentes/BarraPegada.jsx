import { useEffect, useState } from "react";
import { t } from "../idioma";

// El nombre y el código arriba del todo cuando la tarjeta del viaje ya se ha ido
// de la pantalla. Tocarla te sube, como la barra de estado del iPhone.
function BarraPegada({ viaje }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const tarjeta = document.querySelector(".tarjeta-viaje");
    if (!tarjeta || !window.IntersectionObserver) return;
    const mirador = new IntersectionObserver(([e]) => {
      // Solo cuando se ha ido por arriba; si aún no ha llegado, no pinta nada.
      setVisible(!e.isIntersecting && e.boundingClientRect.top < 0);
    });
    mirador.observe(tarjeta);
    return () => mirador.disconnect();
  }, []);

  function subir() {
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: quieto ? "auto" : "smooth" });
  }

  return (
    <button
      className={`barra-pegada ${visible ? "visible" : ""}`}
      onClick={subir}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      title={t("Volver arriba")}
    >
      <span aria-hidden="true">🗺️</span>
      <span className="barra-pegada-nombre">{viaje.nombre}</span>
      <span className="barra-pegada-codigo">{viaje.codigo}</span>
    </button>
  );
}

export default BarraPegada;
