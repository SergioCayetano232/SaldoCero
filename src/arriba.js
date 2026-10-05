// El botón de volver arriba sale cuando ya has bajado pantalla y media: antes
// el formulario aún está a un dedo y solo estorbaría.
export function hayQueSubir(bajado, altoPantalla) {
  return altoPantalla > 0 && bajado > altoPantalla * 1.5;
}
