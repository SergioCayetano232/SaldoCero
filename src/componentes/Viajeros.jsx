import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import NombreEditable from "./NombreEditable";
import { enLista, nombreRepetido, nombreParecido, separarNombres, avisoDeRepetidos, avisoDeParecidos, enUnaLinea, LARGO_VARIOS } from "../nombres";
import { leerCobro, cobroDe, cobroComoTexto } from "../cobro";
import { esAtajoViajero, esOrdenador } from "../teclado";
import { conQuienVa, losQueVanCon, conQuienPuedeIr, MINIMO_PARA_JUNTAR } from "../juntos";

function Viajeros({
  viajeros,
  colores,
  recienLlegados,
  cerrado,
  onAnadir,
  onRenombrar,
  onQuitar,
  onCobro,
  onJuntar,
  enfocar = false,
  soy,
  onSoyYo,
}) {
  const [nombre, setNombre] = useState("");
  // El aviso de los que ya están con ese nombre, si intentas meter otro igual. Y si era
  // añadiendo o renombrando, que solo en lo primero se pone rojo el campo.
  const [repetido, setRepetido] = useState(null);
  const [alRenombrar, setAlRenombrar] = useState(false);
  // Los que se parecen a alguien que ya está, esperando a que digas si son otros.
  const [dudas, setDudas] = useState(null);
  // De quién estás poniendo el Bizum, y lo que llevas escrito.
  const [cobrando, setCobrando] = useState(null);
  const [textoCobro, setTextoCobro] = useState("");
  const [cobroMal, setCobroMal] = useState(false);
  // De quién estás eligiendo con quién paga.
  const [juntando, setJuntando] = useState(null);
  const campo = useRef(null);

  useEffect(() => {
    if (cerrado) return;

    function alPulsar(e) {
      if (!esAtajoViajero(e, Boolean(document.querySelector('[aria-modal="true"]')))) return;
      // Si no, la "a" se escribe en el campo al coger el foco.
      e.preventDefault();
      campo.current?.focus();
      campo.current?.scrollIntoView({ block: "center" });
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [cerrado]);

  function abrirCobro(viajero) {
    if (cobrando === viajero.id) return setCobrando(null);
    setCobrando(viajero.id);
    setTextoCobro(cobroComoTexto(cobroDe(viajero)));
    setCobroMal(false);
  }

  function guardarCobro() {
    const texto = textoCobro.trim();
    const cobro = leerCobro(texto);
    // Vacío es quitarlo, que también vale.
    if (texto && !cobro) return setCobroMal(true);

    onCobro(cobrando, cobro?.valor ?? "");
    setCobrando(null);
  }

  // Los demás de su grupo: "con Ana", o "con Luis y Hugo" si es el que lleva la cuenta.
  function suGrupo(viajero) {
    const lleva = conQuienVa(viajero, viajeros) ?? viajero;
    return [lleva, ...losQueVanCon(lleva, viajeros)].filter((v) => v.id !== viajero.id);
  }

  function juntar(viajero, conId) {
    setJuntando(null);
    if ((viajero.conId ?? null) !== conId) onJuntar(viajero.id, conId);
  }

  function renombrar(viajero, nuevo) {
    const yaEsta = nombreRepetido(nuevo, viajeros, viajero.id);
    setAlRenombrar(true);
    if (yaEsta) return setRepetido(avisoDeRepetidos([yaEsta]));

    setRepetido(null);
    onRenombrar(viajero.id, nuevo);
  }

  async function anadir() {
    const { nuevos, repetidos } = separarNombres(nombre, viajeros);
    const sobran = repetidos.map((r) => r.nombre);
    const parecidos = nuevos
      .map((n) => ({ nombre: n, conQuien: nombreParecido(n, viajeros) }))
      .filter((p) => p.conQuien);
    const seguros = nuevos.filter((n) => !parecidos.some((p) => p.nombre === n));

    setAlRenombrar(false);
    setRepetido(avisoDeRepetidos(repetidos.map((r) => r.yaEsta)));
    setDudas(parecidos.length > 0 ? { parecidos, sobran } : null);
    // Los dudosos se quedan en el campo mientras contestas.
    const quedan = [...parecidos.map((p) => p.nombre), ...sobran];
    setNombre(quedan.join(", "));
    await anadirTodos(seguros, quedan);
  }

  async function anadirTodos(lista, resto) {
    for (const [i, nuevo] of lista.entries()) {
      if (await onAnadir(nuevo)) continue;
      // Si uno falla, lo que faltaba vuelve al campo para darle otra vez.
      setNombre([...lista.slice(i), ...resto].join(", "));
      break;
    }
  }

  function anadirIgual() {
    const { parecidos, sobran } = dudas;
    setDudas(null);
    setNombre(sobran.join(", "));
    anadirTodos(parecidos.map((p) => p.nombre), sobran);
  }

  function eraElMismo() {
    setNombre(dudas.sobran.join(", "));
    setDudas(null);
  }

  return (
    <section className="tarjeta">
      <h2>
        <span className="icono">🧳</span> Viajeros
        {viajeros.length > 0 && <span className="titulo-cuantos">{viajeros.length}</span>}
      </h2>

      {!cerrado && (
        <div className="fila-formulario">
          <input
            ref={campo}
            type="text"
            placeholder="Nombre, o varios: Ana, Luis…"
            aria-keyshortcuts="a"
            title={esOrdenador() ? "También con la A" : undefined}
            autoCapitalize="words"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            maxLength={LARGO_VARIOS}
            autoFocus={enfocar}
            className={repetido && !alRenombrar ? "campo-mal" : ""}
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setRepetido(null);
              setDudas(null);
            }}
            onPaste={(e) => {
              const pegado = e.clipboardData.getData("text");
              if (!pegado.includes("\n")) return;
              e.preventDefault();
              const { selectionStart: desde, selectionEnd: hasta } = e.target;
              setNombre((nombre.slice(0, desde) + enUnaLinea(pegado) + nombre.slice(hasta)).slice(0, LARGO_VARIOS));
              setRepetido(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") anadir();
              if (e.key === "Escape") {
                setNombre("");
                setRepetido(null);
                setDudas(null);
              }
            }}
          />
          <button onClick={anadir} disabled={!nombre.trim()}>
            Añadir
          </button>
        </div>
      )}

      {repetido && (
        <p className="nombre-repetido">{repetido}</p>
      )}

      {dudas && (
        <div className="nombre-parecido" role="status">
          <p>{avisoDeParecidos(dudas.parecidos)}</p>
          <div className="nombre-parecido-botones">
            <button className="enlace" onClick={anadirIgual}>
              Añadir igual
            </button>
            <button className="enlace no-es-otro" onClick={eraElMismo}>
              {dudas.parecidos.length === 1 ? "Es la misma persona" : "Son las mismas"}
            </button>
          </div>
        </div>
      )}

      {viajeros.length === 0 ? (
        <p className="vacio">Aún no hay viajeros. Añade al menos dos para empezar.</p>
      ) : (
        <ul className="lista">
          {viajeros.map((viajero) => (
            <li
              key={viajero.id}
              className={`${viajero.id === soy ? "soy-yo" : ""} ${
                recienLlegados?.has(viajero.id) ? "recien-llegado" : ""
              } ${cobrando === viajero.id || juntando === viajero.id ? "con-cobro" : ""}`}
            >
              <span className="viajero-quien">
                <Avatar nombre={viajero.nombre} color={colores?.get(viajero.nombre)} />
                {cerrado ? (
                  <span className="nombre-fijo">{viajero.nombre}</span>
                ) : (
                  <NombreEditable
                    nombre={viajero.nombre}
                    onGuardar={(nuevo) => renombrar(viajero, nuevo)}
                    titulo={`Cambiar el nombre de ${viajero.nombre}`}
                  />
                )}
                {viajero.id === soy && <span className="etiqueta-tu">tú</span>}
                {suGrupo(viajero).length > 0 && (
                  <span className="etiqueta-con">con {enLista(suGrupo(viajero).map((v) => v.nombre))}</span>
                )}
              </span>

              {!cerrado && viajeros.length >= MINIMO_PARA_JUNTAR && (
                <button
                  className={`boton-cobro ${suGrupo(viajero).length > 0 ? "tiene-cobro" : ""}`}
                  onClick={() => setJuntando(juntando === viajero.id ? null : viajero.id)}
                  title={`Con quién paga ${viajero.nombre} al saldar`}
                >
                  👫
                </button>
              )}

              {/* Con el viaje cerrado también: es cuando más falta hace. */}
              <button
                className={`boton-cobro ${cobroDe(viajero) ? "tiene-cobro" : ""}`}
                onClick={() => abrirCobro(viajero)}
                title={`Bizum o IBAN de ${viajero.nombre}`}
              >
                {cobroDe(viajero)?.tipo === "iban" ? "🏦" : "📲"}
              </button>

              <button
                className="boton-soy"
                onClick={() => onSoyYo(viajero.id)}
                title={viajero.id === soy ? "Ya no soy yo" : "Este soy yo"}
              >
                {viajero.id === soy ? "✓" : "¿yo?"}
              </button>

              {!cerrado && (
                <button
                  className="boton-quitar"
                  onClick={() => onQuitar(viajero.id, viajero.nombre)}
                  title={`Quitar a ${viajero.nombre}`}
                >
                  ✕
                </button>
              )}

              {juntando === viajero.id && (
                <div className="editar-cobro">
                  {conQuienPuedeIr(viajero, viajeros).length === 0 ? (
                    <p className="cobro-ayuda">
                      {viajero.nombre} lleva la cuenta de {enLista(suGrupo(viajero).map((v) => v.nombre))}. Para
                      separarlos, cámbialo desde ellos.
                    </p>
                  ) : (
                    <>
                      <div className="fila-formulario">
                        <select
                          autoFocus
                          value={conQuienVa(viajero, viajeros)?.id ?? ""}
                          onChange={(e) => juntar(viajero, e.target.value || null)}
                          onKeyDown={(e) => e.key === "Escape" && setJuntando(null)}
                          aria-label={`Con quién paga ${viajero.nombre}`}
                        >
                          <option value="">Paga por su cuenta</option>
                          {conQuienPuedeIr(viajero, viajeros).map((v) => (
                            <option key={v.id} value={v.id}>
                              Paga con {v.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="cobro-ayuda">
                        Al saldar, los que van juntos hacen un solo pago. Lo de cada uno se sigue viendo por separado.
                      </p>
                    </>
                  )}
                </div>
              )}

              {cobrando === viajero.id && (
                <div className="editar-cobro">
                  <div className="fila-formulario">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Móvil de Bizum o IBAN"
                      className={cobroMal ? "campo-mal" : ""}
                      value={textoCobro}
                      onChange={(e) => {
                        setTextoCobro(e.target.value);
                        setCobroMal(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") guardarCobro();
                        if (e.key === "Escape") setCobrando(null);
                      }}
                    />
                    <button onClick={guardarCobro}>Guardar</button>
                  </div>
                  <p className={cobroMal ? "cobro-ayuda cobro-mal" : "cobro-ayuda"}>
                    {cobroMal
                      ? "Eso no es un móvil español ni un IBAN válido."
                      : `Para que sepan dónde pagarle a ${viajero.nombre}. Lo ve todo el que tenga el código.`}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {viajeros.length === 1 && !cerrado && (
        <p className="vacio aviso-falta-otro">Con uno solo no hay nada que repartir: añade a otro más.</p>
      )}

      {viajeros.length > 0 && !soy && (
        <p className="vacio aviso-quien-soy">
          Marca quién eres tú y te lo resaltamos en las cuentas.
        </p>
      )}
    </section>
  );
}

export default Viajeros;
