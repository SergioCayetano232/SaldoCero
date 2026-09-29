import { useCifraAnimada } from "../contador";
import { conMoneda } from "../monedas";

// Un importe que cuenta hasta su cifra cuando cambia.
function Cifra({ valor, moneda }) {
  return conMoneda(useCifraAnimada(valor), moneda);
}

export default Cifra;
