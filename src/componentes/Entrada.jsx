import { useEffect, useState } from "react";
import * as datos from "../datos";
import { MONEDAS, monedaConBandera, monedaDeCasa } from "../monedas";
import { haceCuanto } from "../fechas";
import { LARGO_MAXIMO } from "../nombres";
import { codigoDelPortapapeles } from "../codigos";
import { monedaEnLista, seOlvidanTodos, avisoOlvidarTodos, seBuscanViajes, buscarViajes } from "../pasados";
import { tuAno, textoTuAno } from "../tuAno";
import { cuentaDeNeto } from "../titulo";
import { esOrdenador, viajeDeLaTecla } from "../teclado";
import { t } from "../idioma";
import { esperaDeLasDeudas } from "../esperando";

// El candado, y si se te debe algo (o debes), desde cuándo. Sin la cuenta no se
// dice: que el viaje se cerrara hace un mes no le importa a nadie.
function Cerrado({ viaje }) {
  const espera = cuentaDeNeto(viaje.neto, viaje.moneda) ? esperaDeLasDeudas(viaje.cerradoEn, Math.abs(viaje.neto)) : null;
  if (!espera) return <span className="viaje-pasado-cuando">· 🔒 {t("cerrado")}</span>;
  return (
    <span className={`viaje-pasado-cuando ${espera.avisar ? "viaje-pasado-espera" : ""}`}>
      · 🔒 {t("cerrado {cuando}", { cuando: espera.cuando })}
    </span>
  );
}

// Primera pantalla: o creas un viaje o entras en el de alguien con su código.
function Entrada({ onCrear, onEntrar, cargando, error }) {
  const [nombre, setNombre] = useState("");
  const [moneda, setMoneda] = useState(monedaDeCasa);
  const [deCasa] = useState(monedaDeCasa);
  const [codigo, setCodigo] = useState("");
  // Los viajes por los que ya has pasado, guardados en este navegador.
  const [pasados, setPasados] = useState(() => datos.historial());
  const [nadaCopiado, setNadaCopiado] = useState(false);
  const [olvidandoTodos, setOlvidandoTodos] = useState(false);
  const [buscado, setBuscado] = useState("");
  // Las teclas del 1 al 9 van por lo que se ve, no por la lista entera.
  const visibles = seBuscanViajes(pasados) ? buscarViajes(pasados, buscado) : pasados;
  const delAno = textoTuAno(tuAno(pasados, new Date().getFullYear()));
  const sePuedePegar = typeof navigator !== "undefined" && Boolean(navigator.clipboard?.readText);

  async function pegar() {
    const pegado = await codigoDelPortapapeles();
    setNadaCopiado(!pegado);
    if (!pegado) return;
    setCodigo(pegado);
    onEntrar(pegado);
  }

  useEffect(() => {
    if (cargando) return;

    function alPulsar(e) {
      const cual = viajeDeLaTecla(e, visibles.length, Boolean(document.querySelector('[aria-modal="true"]')));
      if (cual < 0) return;
      e.preventDefault();
      onEntrar(visibles[cual].codigo);
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [cargando, visibles, onEntrar]);

  function olvidar(codigoViaje) {
    datos.olvidarDelHistorial(codigoViaje);
    setPasados(datos.historial());
  }

  function olvidarTodos() {
    datos.olvidarHistorial();
    setPasados([]);
    setOlvidandoTodos(false);
  }

  return (
    <>
      <section className="tarjeta">
        <h2><span className="icono">🗺️</span> {t("Empezar un viaje")}</h2>

        <div className="fila-formulario">
          <input
            type="text"
            placeholder={t("Nombre del viaje (Lisboa, Fallas...)")}
            maxLength={LARGO_MAXIMO}
            autoCapitalize="sentences"
            enterKeyHint="go"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCrear(nombre, moneda);
            }}
            disabled={cargando}
          />
          <select
            className="selector-moneda"
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            disabled={cargando}
            title={t("Moneda del viaje")}
          >
            {MONEDAS.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {monedaConBandera(m.codigo)}
              </option>
            ))}
          </select>
          <button onClick={() => onCrear(nombre, moneda)} disabled={cargando}>
            {t("Crear")}
          </button>
        </div>

        <p className="vacio">{t("Te daremos un código para pasárselo a los demás. Las cuentas se harán en {moneda}.", { moneda })}</p>
      </section>

      <section className="tarjeta">
        <h2><span className="icono">🔑</span> {t("Entrar en uno")}</h2>

        <div className="fila-formulario">
          <input
            type="text"
            className="campo-codigo"
            placeholder={t("Código del viaje")}
            // Que el corrector del móvil no convierta el código en una palabra.
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase());
              setNadaCopiado(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && codigo.trim()) onEntrar(codigo);
              if (e.key === "Escape") {
                setCodigo("");
                setNadaCopiado(false);
              }
            }}
            disabled={cargando}
          />
          <button onClick={() => onEntrar(codigo)} disabled={cargando || !codigo.trim()}>
            {t("Entrar")}
          </button>
        </div>

        <p className="vacio">
          {nadaCopiado ? t("No hay ningún código copiado.") : t("El que te haya pasado quien creó el viaje.")}{" "}
          {sePuedePegar && !codigo && (
            <button className="boton-pegar" onClick={pegar} disabled={cargando}>
              📋 {t("Pegar el que te han mandado")}
            </button>
          )}
        </p>
      </section>

      {error && <p className="error">{error}</p>}

      {pasados.length > 0 && (
        <section className="tarjeta">
          <h2>
            <span className="icono">🕘</span> {t("Tus viajes")}
            <span className="titulo-cuantos">{pasados.length}</span>
          </h2>

          {delAno && (
            <div className="tu-ano">
              <span className="tu-ano-icono" aria-hidden="true">📅</span>
              <p>
                <strong>{delAno.titulo}</strong>
                <span className="tu-ano-cifra">{delAno.cifra}</span>
                <small>{delAno.masCaro}</small>
              </p>
            </div>
          )}

          {seBuscanViajes(pasados) && (
            <input
              type="search"
              className="filtro-buscar buscar-viajes"
              autoComplete="off"
              placeholder={t("Buscar por nombre o código")}
              aria-label={t("Buscar en tus viajes")}
              enterKeyHint="search"
              value={buscado}
              onChange={(e) => setBuscado(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setBuscado("")}
            />
          )}

          {visibles.length === 0 && <p className="vacio">{t('Ningún viaje con "{texto}".', { texto: buscado.trim() })}</p>}

          <ul className="lista">
            {visibles.map((viaje, i) => (
              <li key={viaje.codigo}>
                <button
                  className="viaje-pasado"
                  onClick={() => onEntrar(viaje.codigo)}
                  disabled={cargando}
                  aria-keyshortcuts={i < 9 ? String(i + 1) : undefined}
                  title={esOrdenador() && i < 9 ? t("También con el {n}", { n: i + 1 }) : undefined}
                >
                  <span className="viaje-pasado-nombre">{viaje.nombre}</span>
                  <small className="reparto">
                    {viaje.codigo}
                    {monedaEnLista(viaje.moneda, deCasa) && (
                      <span className="viaje-pasado-cuando">· {monedaEnLista(viaje.moneda, deCasa)}</span>
                    )}
                    {viaje.visto && <span className="viaje-pasado-cuando">· {haceCuanto(viaje.visto)}</span>}
                    {viaje.cerrado && <Cerrado viaje={viaje} />}
                    {viaje.soloVer && <span className="viaje-pasado-cuando">· 👁️ {t("para mirar")}</span>}
                    {cuentaDeNeto(viaje.neto, viaje.moneda) && (
                      <span className={`viaje-pasado-cuando viaje-pasado-saldo ${viaje.neto > 0 ? "le-deben" : "debe"}`}>
                        · {cuentaDeNeto(viaje.neto, viaje.moneda)}
                      </span>
                    )}
                  </small>
                </button>
                <button
                  className="boton-quitar"
                  onClick={() => olvidar(viaje.codigo)}
                  title={t("Quitar de la lista")}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          {seOlvidanTodos(pasados) &&
            (olvidandoTodos ? (
              <div className="aviso-repetido" role="alert">
                <p>{avisoOlvidarTodos(pasados.length)}</p>
                <div className="aviso-repetido-botones">
                  <button className="aviso-si" onClick={olvidarTodos}>
                    {t("Sí, quitarlos")}
                  </button>
                  <button className="aviso-no" onClick={() => setOlvidandoTodos(false)} autoFocus>
                    {t("No")}
                  </button>
                </div>
              </div>
            ) : (
              <button className="enlace olvidar-todos" onClick={() => setOlvidandoTodos(true)}>
                {t("Quitarlos todos de la lista")}
              </button>
            ))}

          <p className="vacio">
            {t("Solo se guardan en este móvil. Si borras los datos del navegador o entras desde otro sitio, vuelves con el código.")}
          </p>
        </section>
      )}

      <ul className="como-va">
        <li>
          <span className="paso-num">1</span>
          {t("Creas el viaje y les pasas el código")}
        </li>
        <li>
          <span className="paso-num">2</span>
          {t("Cada uno apunta lo que va pagando")}
        </li>
        <li>
          <span className="paso-num">3</span>
          {t("Al volver, te decimos quién le debe a quién")}
        </li>
      </ul>
    </>
  );
}

export default Entrada;
