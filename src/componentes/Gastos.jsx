import { useState, useEffect } from "react";
import { participantesDeGasto } from "../calculos";
import { MONEDAS, cambio, conMoneda } from "../monedas";
import { CATEGORIAS, POR_DEFECTO, categoriaDe } from "../categorias";
import { hoy, comoTitulo, porDias } from "../fechas";

function Gastos({ viajeros, gastos, monedaViaje, onAnadir, onEditar, onQuitar }) {
  const [pagadorId, setPagadorId] = useState("");
  const [importe, setImporte] = useState("");
  const [moneda, setMoneda] = useState(monedaViaje);
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState(POR_DEFECTO);
  // Las partes de cada uno. Vacío = a partes iguales, que es lo normal.
  const [partes, setPartes] = useState({});
  const [repartoAbierto, setRepartoAbierto] = useState(false);
  // Por defecto hoy, que es cuando se apunta casi todo.
  const [fecha, setFecha] = useState(hoy);
  // El cambio que nos ha dado la API, con la moneda a la que corresponde.
  // Así sabemos si lo que tenemos guardado sirve para la moneda de ahora.
  const [cambioTraido, setCambioTraido] = useState(null);

  // Si pagas en la moneda del viaje, uno por uno. Si no, lo que diga la API,
  // y undefined mientras está de camino.
  const tasa =
    moneda === monedaViaje
      ? 1
      : cambioTraido?.moneda === moneda
        ? cambioTraido.tasa
        : undefined;
  // Entre quiénes se reparte. null = no lo has tocado, así que van todos.
  const [participantes, setParticipantes] = useState(null);
  // El gasto que estás tocando ahora mismo. Vacío si estás apuntando uno nuevo.
  const [editando, setEditando] = useState(null);

  // Cada vez que cambias de moneda, preguntamos a cuánto está.
  useEffect(() => {
    if (moneda === monedaViaje) return;

    let vigente = true;

    cambio(moneda, monedaViaje).then((tasa) => {
      if (vigente) setCambioTraido({ moneda, tasa });
    });

    return () => {
      vigente = false;
    };
  }, [moneda, monedaViaje]);

  // Los gastos agrupados por día, que es como se leen mejor.
  const dias = porDias(gastos);

  const todosLosIds = viajeros.map((v) => v.id);
  // Mientras no toques las casillas, el gasto va entre todos.
  const marcados = participantes ?? todosLosIds;
  const entreTodos = marcados.length === viajeros.length;

  function alternar(id) {
    const nuevos = marcados.includes(id)
      ? marcados.filter((otro) => otro !== id)
      : [...marcados, id];

    setParticipantes(nuevos);
  }

  function limpiar() {
    setImporte("");
    setMoneda(monedaViaje);
    setConcepto("");
    setCategoria(POR_DEFECTO);
    setPartes({});
    setRepartoAbierto(false);
    setFecha(hoy());
    setParticipantes(null);
    setEditando(null);
  }

  // Subimos el gasto al formulario para poder cambiarlo.
  function editar(gasto) {
    setEditando(gasto.id);
    setPagadorId(gasto.pagadorId);
    setImporte(String(gasto.importe));
    setMoneda(gasto.moneda ?? monedaViaje);
    setConcepto(gasto.concepto);
    setCategoria(gasto.categoria ?? POR_DEFECTO);
    setFecha(gasto.fecha ?? hoy());
    setParticipantes(participantesDeGasto(gasto, viajeros).map((v) => v.id));

    // Si el gasto iba repartido a trozos distintos, abrimos ya esa parte.
    const suyas = gasto.partes ?? {};
    const desigual = Object.values(suyas).some((p) => p !== 1);
    setPartes(desigual ? suyas : {});
    setRepartoAbierto(desigual);
  }

  // Lo que le toca a cada uno de los marcados. Por defecto, una parte.
  function partesDeLosMarcados() {
    return Object.fromEntries(marcados.map((id) => [id, partes[id] ?? 1]));
  }

  function cambiarParte(id, valor) {
    const numero = parseFloat(valor);
    setPartes({ ...partes, [id]: isNaN(numero) || numero < 0 ? 0 : numero });
  }

  // Cuánto sale para cada uno con las partes de ahora, para irlo viendo.
  function loQueLeToca(id) {
    const total = parseFloat(importe);
    if (isNaN(total) || total <= 0 || typeof tasa !== "number") return null;

    const suyas = partesDeLosMarcados();
    const suma = Object.values(suyas).reduce((t, p) => t + p, 0);
    if (suma <= 0) return null;

    return ((total * tasa) * (suyas[id] ?? 0)) / suma;
  }

  function guardar() {
    const importeNumero = parseFloat(importe);

    if (pagadorId === "") return;
    if (isNaN(importeNumero) || importeNumero <= 0) return;
    if (marcados.length === 0) return;

    // Sin cambio no podemos convertir, así que no dejamos guardarlo a medias.
    if (typeof tasa !== "number") return;

    const gasto = {
      pagadorId,
      importe: importeNumero,
      moneda,
      // Lo guardamos ya convertido: si mañana cambia el cambio, este viaje no.
      importeConvertido: Number((importeNumero * tasa).toFixed(2)),
      concepto: concepto.trim() === "" ? "Gasto" : concepto.trim(),
      categoria,
      fecha,
      participantes: marcados,
      // Solo mandamos las partes si de verdad hay reparto desigual.
      partes: repartoAbierto ? partesDeLosMarcados() : null,
    };

    if (editando) {
      onEditar(editando, gasto);
      // Terminada la edición, el formulario vuelve a estar en blanco.
      setPagadorId("");
    } else {
      // Dejamos el pagador puesto por si encadena varios gastos.
      onAnadir(gasto);
    }

    limpiar();
  }

  function cancelar() {
    setPagadorId("");
    limpiar();
  }

  // Lo que se gastó ese día, en la moneda del viaje.
  function totalDelDia(dia) {
    return dia.gastos.reduce((t, g) => t + (g.importeConvertido ?? g.importe), 0);
  }

  function nombrePagador(id) {
    const viajero = viajeros.find((v) => v.id === id);
    return viajero ? viajero.nombre : "¿?";
  }

  // "cena · entre Ana y Luis", para saber de un vistazo cómo se repartió.
  function textoReparto(gasto) {
    const suyos = participantesDeGasto(gasto, viajeros);
    // Puede quedarse sin nadie si borras a los que iban en él.
    if (suyos.length === 0) return "sin nadie a quien repartirlo";
    // Si va repartido desigual, se dice: si no, engaña ver "entre todos".
    const desigual = Object.values(gasto.partes ?? {}).some((p) => p !== 1);
    const comoSeParte = desigual ? ", a partes distintas" : "";

    if (suyos.length === viajeros.length) return `entre todos${comoSeParte}`;

    return `entre ${suyos.map((v) => v.nombre).join(", ")}${comoSeParte}`;
  }

  return (
    <section className="tarjeta">
      <h2><span className="icono">🧾</span> Gastos</h2>

      {viajeros.length === 0 ? (
        <p className="vacio">Primero añade viajeros para poder registrar gastos.</p>
      ) : (
        <>
          <div className="formulario-gasto">
            <select value={pagadorId} onChange={(e) => setPagadorId(e.target.value)}>
              <option value="">¿Quién pagó?</option>
              {viajeros.map((viajero) => (
                <option key={viajero.id} value={viajero.id}>
                  {viajero.nombre}
                </option>
              ))}
            </select>

            <div className="fila-importe">
              <input
                type="number"
                placeholder="Importe"
                min="0"
                step="0.01"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
              />
              <select
                className="selector-moneda"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                title="¿En qué moneda se pagó?"
              >
                {MONEDAS.map((m) => (
                  <option key={m.codigo} value={m.codigo}>
                    {m.codigo}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="campo-fecha"
                value={fecha}
                max={hoy()}
                onChange={(e) => setFecha(e.target.value || hoy())}
                title="¿Qué día fue?"
              />
            </div>

            {moneda !== monedaViaje && (
              <p className="conversion">
                {tasa === undefined ? (
                  <>Mirando a cuánto está el cambio…</>
                ) : tasa === null ? (
                  <span className="aviso">
                    No hemos podido saber el cambio. Apúntalo en {monedaViaje}.
                  </span>
                ) : importe > 0 ? (
                  <>
                    Son <strong>{conMoneda(importe * tasa, monedaViaje)}</strong> · 1{" "}
                    {moneda} = {tasa.toFixed(4)} {monedaViaje}
                  </>
                ) : (
                  <>
                    1 {moneda} = {tasa.toFixed(4)} {monedaViaje}
                  </>
                )}
              </p>
            )}

            <input
              type="text"
              placeholder="Concepto (cena, hotel...)"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") guardar();
              }}
            />

            {/* En qué se fue. Van como pastillas y no en un desplegable:
                se ven todas a la vez y se elige de un toque. */}
            <div className="categorias">
              {CATEGORIAS.map((c) => (
                <button
                  key={c.id}
                  className={`pastilla-categoria ${categoria === c.id ? "elegida" : ""}`}
                  onClick={() => setCategoria(c.id)}
                  title={c.nombre}
                  style={{ "--color-categoria": c.color }}
                >
                  <span className="pastilla-emoji">{c.emoji}</span>
                  {c.nombre}
                </button>
              ))}
            </div>

            <div className="participantes">
              <p className="participantes-titulo">
                {marcados.length === 0 ? (
                  <span className="aviso">Marca al menos a uno para repartir el gasto</span>
                ) : (
                  <>
                    Se reparte entre{" "}
                    {entreTodos ? <strong>todos</strong> : <strong>{marcados.length}</strong>}
                  </>
                )}
                {!entreTodos && (
                  <button className="enlace" onClick={() => setParticipantes(todosLosIds)}>
                    marcar todos
                  </button>
                )}
              </p>

              <div className="casillas">
                {viajeros.map((viajero) => (
                  <label key={viajero.id} className="casilla">
                    <input
                      type="checkbox"
                      checked={marcados.includes(viajero.id)}
                      onChange={() => alternar(viajero.id)}
                    />
                    {viajero.nombre}
                  </label>
                ))}
              </div>

              {/* El reparto desigual va escondido: la mayoría de gastos se
                  parten por igual y no hace falta marear con esto. */}
              {marcados.length > 1 && (
                <button
                  className="enlace enlace-reparto"
                  onClick={() => setRepartoAbierto(!repartoAbierto)}
                >
                  {repartoAbierto ? "← volver a partes iguales" : "¿unos más que otros?"}
                </button>
              )}

              {repartoAbierto && marcados.length > 1 && (
                <div className="partes">
                  <p className="partes-ayuda">
                    Cuántas partes paga cada uno. Con 2 y 1, el primero paga el doble.
                  </p>

                  {viajeros
                    .filter((v) => marcados.includes(v.id))
                    .map((viajero) => {
                      const suyo = loQueLeToca(viajero.id);

                      return (
                        <div className="fila-parte" key={viajero.id}>
                          <span className="parte-nombre">{viajero.nombre}</span>

                          <input
                            type="number"
                            className="parte-campo"
                            min="0"
                            step="0.5"
                            value={partes[viajero.id] ?? 1}
                            onChange={(e) => cambiarParte(viajero.id, e.target.value)}
                          />

                          {suyo !== null && (
                            <span className="parte-importe">
                              {conMoneda(suyo, monedaViaje)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {editando ? (
              <div className="fila-botones">
                <button onClick={guardar} disabled={marcados.length === 0 || typeof tasa !== "number"}>
                  Guardar cambios
                </button>
                <button className="boton-cancelar" onClick={cancelar}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={guardar} disabled={marcados.length === 0 || typeof tasa !== "number"}>
                Añadir gasto
              </button>
            )}
          </div>

          {gastos.length === 0 ? (
            <p className="vacio">Todavía no hay gastos.</p>
          ) : (
            dias.map((dia) => (
              <div className="dia" key={dia.fecha || "sin-fecha"}>
                {/* El día solo se pone si el viaje dura más de uno. */}
                {dias.length > 1 && (
                  <p className="dia-titulo">
                    {dia.fecha ? comoTitulo(dia.fecha) : "Sin fecha"}
                    <span className="dia-total">
                      {conMoneda(totalDelDia(dia), monedaViaje)}
                    </span>
                  </p>
                )}

                <ul className="lista">
                  {dia.gastos.map((gasto) => (
                    <li
                      key={gasto.id}
                      className={gasto.id === editando ? "editandose" : ""}
                    >
                      <span
                        className="gasto-icono"
                        title={categoriaDe(gasto.categoria).nombre}
                      >
                        {categoriaDe(gasto.categoria).emoji}
                      </span>

                      <span>
                        <span className="gasto-concepto">{gasto.concepto}</span>
                        <br />
                        <small className="reparto">
                          {nombrePagador(gasto.pagadorId)} · {textoReparto(gasto)}
                        </small>
                      </span>

                      <span className="gasto-importe">
                        {conMoneda(gasto.importe, gasto.moneda ?? monedaViaje)}
                        {gasto.moneda && gasto.moneda !== monedaViaje && (
                          <small className="gasto-convertido">
                            {conMoneda(gasto.importeConvertido, monedaViaje)}
                          </small>
                        )}
                      </span>

                      <span className="acciones">
                        <button
                          className="boton-editar"
                          onClick={() => editar(gasto)}
                          title="Editar gasto"
                        >
                          ✏️
                        </button>
                        <button
                          className="boton-quitar"
                          onClick={() => onQuitar(gasto.id)}
                        >
                          ✕
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </>
      )}
    </section>
  );
}

export default Gastos;
