import { useState } from "react";
import { trozosDeConfeti } from "../confeti";

function Confeti() {
  // Se sortean una vez al salir, no en cada pintada.
  const [trozos] = useState(() => trozosDeConfeti());

  // Si has pedido menos movimiento, ni lo pintamos.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return null;

  return (
    <div className="confeti" aria-hidden="true">
      {trozos.map((t) => (
        <span
          key={t.id}
          className={`confeti-trozo ${t.redondo ? "redondo" : ""}`}
          style={{
            left: `${t.x}%`,
            width: `${t.ancho}px`,
            height: `${t.redondo ? t.ancho : t.ancho * 0.45}px`,
            backgroundColor: t.color,
            animationDelay: `${t.retraso}s`,
            animationDuration: `${t.duracion}s`,
            "--deriva": `${t.deriva}px`,
            "--giro": `${t.giro}deg`,
          }}
        />
      ))}
    </div>
  );
}

export default Confeti;
