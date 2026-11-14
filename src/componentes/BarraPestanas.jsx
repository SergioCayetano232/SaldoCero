import { t } from "../idioma";

// Las tres partes del viaje, abajo, donde llega el pulgar.
// Son pestañas de verdad: con las flechas se pasa de una a otra.
const PESTANAS = [
  { id: "gastos", texto: "Gastos", icono: <path d="M6 4h12v16l-3-2-3 2-3-2-3 2zM9 9h6M9 13h4" /> },
  { id: "cuentas", texto: "Cuentas", icono: <path d="M4 8h13l-3-3M20 16H7l3 3" /> },
  { id: "viaje", texto: "Viaje", icono: <path d="M4 8h16v11H4zM9 8V5h6v3M4 13h16" /> },
];

function BarraPestanas({ activa, onCambiar, avisos = {} }) {
  function alPulsar(e) {
    const i = PESTANAS.findIndex((p) => p.id === activa);
    const paso = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!paso) return;
    e.preventDefault();
    const siguiente = PESTANAS[(i + paso + PESTANAS.length) % PESTANAS.length];
    onCambiar(siguiente.id);
    document.getElementById(`pestana-${siguiente.id}`)?.focus();
  }

  return (
    <nav className="barra-pestanas" aria-label={t("Partes del viaje")}>
      <div role="tablist" aria-label={t("Partes del viaje")} onKeyDown={alPulsar}>
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            id={`pestana-${p.id}`}
            role="tab"
            aria-selected={activa === p.id}
            aria-controls={`panel-${p.id}`}
            tabIndex={activa === p.id ? 0 : -1}
            className={`pestana ${activa === p.id ? "activa" : ""}`}
            onClick={() => onCambiar(p.id)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {p.icono}
            </svg>
            <span>{t(p.texto)}</span>
            {avisos[p.id] > 0 && (
              <span className="pestana-aviso">
                {avisos[p.id]}
                <span className="solo-lector"> {t("pendientes")}</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default BarraPestanas;
