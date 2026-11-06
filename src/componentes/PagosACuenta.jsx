import { useState } from "react";
import { conMoneda, leerImporte } from "../monedas";
import { trozosDeDeuda } from "../aCuenta";
import Avatar from "./Avatar";
import { t } from "../idioma";

// Lo que se va pagando de las deudas a trozos: "Luis le ha dado 20 € a Ana".
function PagosACuenta({ viajeros, pagos, parciales, colores, moneda, onAnadir, onQuitar }) {
  const [abierto, setAbierto] = useState(false);
  const [deId, setDeId] = useState("");
  const [aId, setAId] = useState("");
  const [importe, setImporte] = useState("");

  const cantidad = leerImporte(importe);
  const vale = deId && aId && deId !== aId && cantidad !== null;
  const pendientes = pagos.filter((p) => !p.saldado);
  // Si entre esos dos hay deuda, se la enseñamos para que no tenga que buscarla.
  const deuda = pendientes.find((p) => p.deId === deId && p.aId === aId);
  // Si se ha ido alguno de los dos, ya no cuenta en las cuentas, así que tampoco aquí.
  const visibles = parciales.filter(
    (p) => viajeros.some((v) => v.id === p.deId) && viajeros.some((v) => v.id === p.aId)
  );

  function nombre(id) {
    return viajeros.find((v) => v.id === id)?.nombre ?? "¿?";
  }

  // Se abre con la primera deuda puesta, que casi siempre es esa.
  function abrir() {
    setDeId(pendientes[0]?.deId ?? "");
    setAId(pendientes[0]?.aId ?? "");
    setImporte("");
    setAbierto(true);
  }

  async function apuntar() {
    if (!vale) return;
    if (await onAnadir({ deId, aId, importe: cantidad })) setAbierto(false);
  }

  if (visibles.length === 0 && pendientes.length === 0) return null;

  return (
    <div className="a-cuenta">
      {visibles.length > 0 && (
        <>
          <h4>{t("Pagado a cuenta")}</h4>
          <ul className="lista-parciales">
            {visibles.map((p) => (
              <li key={p.id} className="parcial">
                <Avatar nombre={nombre(p.deId)} color={colores?.get(nombre(p.deId))} pequeno />
                <span className="parcial-quien">
                  {nombre(p.deId)} <span className="pago-flecha">→</span> {nombre(p.aId)}
                </span>
                <span className="parcial-cantidad">{conMoneda(p.importe, moneda)}</span>
                <button
                  className="boton-quitar"
                  onClick={() => onQuitar(p, nombre(p.deId), nombre(p.aId))}
                  title={t("Quitar este pago")}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {abierto ? (
        <div className="formulario-parcial" onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}>
          <div className="fila-parcial">
            <select value={deId} onChange={(e) => setDeId(e.target.value)} aria-label={t("Quién paga")}>
              <option value="">{t("¿Quién paga?")}</option>
              {viajeros.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                </option>
              ))}
            </select>
            <span className="pago-flecha">→</span>
            <select value={aId} onChange={(e) => setAId(e.target.value)} aria-label={t("A quién")}>
              <option value="">{t("¿A quién?")}</option>
              {viajeros
                .filter((v) => v.id !== deId)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div className="fila-formulario">
            <input
              type="text"
              inputMode="decimal"
              placeholder={deuda ? t("De {cifra}", { cifra: conMoneda(deuda.cantidad, moneda) }) : t("Cuánto")}
              enterKeyHint="done"
              value={importe}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setImporte(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apuntar()}
              aria-label={t("Cuánto ha pagado")}
            />
            <button onClick={apuntar} disabled={!vale}>
              {t("Apuntar")}
            </button>
            <button className="boton-cancelar" onClick={() => setAbierto(false)}>
              {t("Cancelar")}
            </button>
          </div>

          {deuda && (
            <div className="trozos-deuda">
              {trozosDeDeuda(deuda.cantidad).map((trozo) => (
                <button
                  key={trozo.nombre}
                  className="pastilla-interruptor"
                  onClick={() => setImporte(trozo.texto)}
                  aria-pressed={cantidad === leerImporte(trozo.texto)}
                >
                  {t(trozo.nombre)}
                </button>
              ))}
            </div>
          )}

          {deuda && cantidad > deuda.cantidad + 0.005 && (
            <p className="aviso">
              {t("Es más de lo que le debe: el resto pasará a debérselo {nombre}.", { nombre: nombre(aId) })}
            </p>
          )}
        </div>
      ) : (
        pendientes.length > 0 && (
          <button className="enlace" onClick={abrir}>
            {t("¿Alguien ha pagado una parte?")}
          </button>
        )
      )}
    </div>
  );
}

export default PagosACuenta;
