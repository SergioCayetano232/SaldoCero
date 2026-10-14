import { trozosResaltados } from "../resaltar";

function Resaltado({ texto, buscado }) {
  return trozosResaltados(texto, buscado).map((trozo, i) =>
    trozo.resaltado ? <mark key={i}>{trozo.texto}</mark> : trozo.texto,
  );
}

export default Resaltado;
