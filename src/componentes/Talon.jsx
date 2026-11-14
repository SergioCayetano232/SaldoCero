import { conMoneda } from "../monedas";
import { t } from "../idioma";

// El talón de la cartera, arriba del todo y siempre a la vista: lo tuyo a la
// izquierda, la próxima a la derecha, con el troquel en medio.
function Talon({ datos, moneda, onCuentas, onQuienEres }) {
  const { saldo, toca } = datos;

  return (
    <section className="talon" aria-label={t("Tus cuentas")}>
      <SaldoDelTalon saldo={saldo} moneda={moneda} onCuentas={onCuentas} onQuienEres={onQuienEres} />
      {toca && (
        <>
          <span className="talon-troquel" aria-hidden="true" />
          <button className="talon-toca" onClick={onCuentas}>
            <span className="talon-etiqueta">{t("Le toca pagar")}</span>
            <span className={`talon-quien ${toca.tipo}`}>
              {toca.tipo === "tu" ? t("A ti") : toca.tipo === "cualquiera" ? t("A cualquiera") : toca.nombre}
            </span>
          </button>
        </>
      )}
    </section>
  );
}

function SaldoDelTalon({ saldo, moneda, onCuentas, onQuienEres }) {
  if (saldo.tipo === "sin-ti") {
    return (
      <button className="talon-saldo sin-ti" onClick={onQuienEres}>
        <span className="talon-etiqueta">{t("Tu saldo")}</span>
        <span className="talon-pregunta">{t("¿Quién eres?")}</span>
        <span className="talon-nota">{t("Dinos cuál eres y te sacamos tus cuentas")}</span>
      </button>
    );
  }

  const conCifra = saldo.tipo === "debes" || saldo.tipo === "te-deben";
  const etiqueta = { debes: t("Debes"), "te-deben": t("Te deben"), pagado: t("Tu saldo"), "a-cero": t("Tu saldo") }[saldo.tipo];

  return (
    <button className={`talon-saldo ${saldo.tipo}`} onClick={onCuentas}>
      <span className="talon-etiqueta">{etiqueta}</span>
      {conCifra ? (
        <span className="talon-cifra">{conMoneda(saldo.cifra, moneda)}</span>
      ) : (
        <span className="talon-cifra a-cero">{saldo.tipo === "pagado" ? t("Todo pagado") : t("Estás a cero")}</span>
      )}
      {saldo.ademas > 0 && (
        <span className="talon-nota">{t("y te deben {cifra}", { cifra: conMoneda(saldo.ademas, moneda) })}</span>
      )}
    </button>
  );
}

export default Talon;
