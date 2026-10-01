import { useEffect, useRef, useState } from "react";
import { nombreNuevo, LARGO_MAXIMO } from "../nombres";

// Un nombre que se cambia tocándolo. Enter o salir del campo guarda; Escape no.
function NombreEditable({ nombre, onGuardar, como: Etiqueta = "span", className = "", titulo }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(nombre);
  const campo = useRef(null);
  // Al quitar el campo puede llegar un blur tardío: que no guarde dos veces.
  const terminado = useRef(false);

  useEffect(() => {
    if (editando) campo.current?.select();
  }, [editando]);

  function empezar() {
    terminado.current = false;
    setTexto(nombre);
    setEditando(true);
  }

  function terminar(guardar) {
    if (terminado.current) return;
    terminado.current = true;
    setEditando(false);

    const nuevo = guardar && nombreNuevo(texto, nombre);
    if (nuevo) onGuardar(nuevo);
  }

  if (editando) {
    return (
      <input
        ref={campo}
        className={`campo-nombre ${className}`}
        value={texto}
        maxLength={LARGO_MAXIMO}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => terminar(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") terminar(true);
          if (e.key === "Escape") terminar(false);
        }}
        aria-label={titulo}
      />
    );
  }

  return (
    <Etiqueta className={`nombre-editable ${className}`}>
      <button className="boton-nombre" onClick={empezar} title={titulo}>
        {nombre}
        <span className="lapiz" aria-hidden="true">
          ✎
        </span>
      </button>
    </Etiqueta>
  );
}

export default NombreEditable;
