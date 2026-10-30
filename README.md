# SaldoCero 💸

Vuelves de un finde fuera y empieza el lío: que si yo pagué la cena, que si tú
pusiste la gasolina, que si el hotel lo adelantó aquel. SaldoCero lleva esa
cuenta por ti.

Creas el viaje, pasas el código a los demás y cada uno va apuntando gastos desde
su móvil. La app te dice cuánto ha puesto cada uno, a quién le toca pagar la
próxima y, al volver, quién le tiene que dar dinero a quién.

Pruébala aquí: https://saldo-cero-eight.vercel.app/

## Qué hace

- Creas un viaje y te da un código; con ese código entran los demás.
- O los invitas con un enlace o un QR, y entran directos. Si te llega el
  código por WhatsApp, le das a "Pegar" y dentro.
- Todos apuntáis gastos a la vez, cada uno desde su móvil, y te avisa de lo
  que apuntan los demás.
- Cada gasto lleva quién pagó, cuánto, en qué día y en concepto de qué.
- O lo dictas: "cena 45 euros, pagó Ana", y se rellena solo.
- Marcas cuál de los viajeros eres tú y te resalta tus cuentas.
- ¿Nombre mal escrito? Lo tocas y lo cambias.
- Cada gasto va en una categoría, y el resumen te dice en qué se va el dinero,
  del grupo o de cada uno.
- Si un gasto no es de todos, marcas solo a los que van.
- Y si uno come el doble que los demás, lo repartes en partes desiguales, o
  pones lo que paga cada uno. O la cuenta del restaurante plato a plato.
- Si te equivocas, editas el gasto y ya está. En el móvil, deslizándolo.
- Le haces una foto al ticket y se queda guardada con el gasto. Te lee el
  total para no tener que escribirlo, y si hace falta le pones una nota:
  "incluye la propina".
- También le puedes compartir la foto desde la galería, y te abre el gasto.
- En el importe puedes sumar, restar, multiplicar y dividir, "12,5+8", "60-10",
  "3×4,5" o "120÷4", sin sacar la calculadora.
- Si alguien ya apuntó lo mismo ese día, te pregunta antes de duplicarlo.
- El desayuno de cada día lo copias de un toque, y al escribir te sugiere lo
  que ya has apuntado, con lo que costó la última vez.
- Buscas y filtras los gastos por concepto, importe, persona, categoría, si
  llevan ticket o nota, si se pagaron en otra moneda, si no son de todos, o
  solo los de hoy. O ves solo los tuyos con lo que te toca de cada uno.
- Y los ordenas como quieras: por días, por lo que costaron, por quién pagó,
  por categoría, por nombre, por cuándo se apuntaron o por lo que más te toca
  a ti.
- Si borras algo sin querer, lo deshaces.
- Puedes pagar en otra moneda y te lo convertimos a la del viaje.
- Si hacéis bote, apuntas lo que pone cada uno y pagáis desde ahí.
- Te dice a quién le toca pagar la próxima: al que menos ha puesto.
- Y al final, la lista de quién paga a quién para quedar todos a cero, con un
  diagrama para verlo de un vistazo.
- Vas marcando las deudas que ya se han pagado, aunque sea solo una parte.
- Y al que se hace el loco le mandas un WhatsApp con la cifra ya puesta, y tu
  Bizum o tu IBAN para que no tenga excusa.
- Le pones un presupuesto al viaje y ves cuánto os queda y para cuántos días
  os llega. Y te avisa si un gasto os hace pasaros.
- Una gráfica te enseña lo que se gastó cada día, y el resumen lo que lleváis hoy.
  Otra, cómo ha ido el saldo de cada uno día a día.
- Al volver, cierras el viaje y ya nadie toca los gastos. Y te sale el viaje
  en cifras: el día más caro, el más movido, quién puso más y quién menos, lo
  más caro por cabeza, lo que más se repitió ("Café, 7 veces")... Y te lo
  cuenta en historias, como las de Instagram.
- El resumen lo compartes por donde quieras, en texto o en una imagen, o te lo
  descargas en un txt. Los gastos, en un Excel con los totales al final.
- Guarda los viajes en los que has estado, para volver sin buscar el código.


## Se instala en el móvil

Es una PWA, así que puedes añadirla a la pantalla de inicio y se abre como una
app más, sin barra del navegador. Si mantienes pulsado el icono tienes dos
atajos: apuntar un gasto y ver quién paga a quién.

Sin internet abre igual, pero solo la app: los gastos no los guardamos en el
móvil a propósito. Un viaje lo van tocando varios a la vez, y enseñarte unas
cuentas viejas sin avisar sería peor que decirte que no hay conexión.

## Con teclado

En el ordenador casi todo tiene su tecla, y con la `?` te salen todas. Las que
más se usan:

| Tecla | Qué hace |
|---|---|
| `N` | Apuntar un gasto nuevo |
| `D` | Dictarlo |
| `F` | Hacerle la foto al ticket |
| `A` | Añadir un viajero |
| `/` | Buscar un gasto |
| `M` / `H` | Ver solo lo tuyo / solo lo de hoy |
| `C` | Ir a quién paga a quién |
| `P` / `B` | El presupuesto / el bote |
| `S` / `G` / `E` | Compartir el resumen / guardarlo en un txt / bajar el Excel |
| `I` | Enseñar el QR para invitar |
| `K` | Copiar el código del viaje |
| `T` | Cambiar el tema |
| `Ctrl+Enter` | Guardar el gasto desde cualquier campo (`⌘+Enter` en Mac) |
| `Ctrl+Z` | Recuperar lo último que has quitado (`⌘+Z` en Mac) |
| `Esc` | Dejar de editar, salir del buscador o cerrar lo que tengas abierto |

Un gasto también se edita con doble clic. Y con el viaje cerrado, la `V` lo pone
en historias: ahí pasas con las flechas, paras con el espacio, vas a la primera o
a la última con `Inicio` y `Fin`, y la `R` vuelve a empezar.

Mientras escribes en un campo las letras son letras, no atajos.

## Lo de las monedas

Cada viaje tiene la suya, y es en la que se hacen todas las cuentas. Si pagas en
otra, te pedimos el cambio y **guardamos las dos cifras**: lo que pagaste de
verdad y lo que sale en la moneda del viaje.

Lo guardo convertido a propósito. Si lo calculara al mostrarlo, el cambio de hoy
te movería las cuentas de un viaje de hace tres meses, y eso no tiene sentido:
lo que pagaste, pagado está.

El cambio lo da [Frankfurter](https://frankfurter.dev), que es gratis y no pide
registrarse. Solo trae las monedas del Banco Central Europeo, así que el dírham
o el peso colombiano no los sabe: para esas, o si no hay internet, escribes tú
el cambio. También puedes cambiar el del día si el banco te cobró otro.

## Con qué está hecho

React, Vite, y JavaScript y CSS, sin librerías de estilos. Aparte solo hay dos
librerías: `qrcode`, para el QR, y `tesseract.js`, para leer el total del
ticket. Esa pesa unos megas, así que solo se baja la primera vez que le das a
leer uno, y la foto se lee en el propio móvil. Los viajes se guardan en
Supabase, y un service worker de treinta líneas es todo lo que hace falta para
lo de instalarla.

No hay usuarios ni contraseñas. La llave es el código del viaje: el navegador lo
manda en cada petición y la base de datos solo te deja tocar el viaje al que
pertenece ese código. La lista de viajes no se puede consultar, así que nadie
puede ir pescando códigos.

Los viajes por los que has pasado se guardan en tu propio navegador, no en el
servidor. Si entras desde otro móvil, ahí no están.

## Ejecutarlo en tu ordenador

Necesitas una cuenta de Supabase, que es gratis.

```bash
git clone https://github.com/SergioCayetano232/SaldoCero.git
cd SaldoCero
npm install
cp .env.example .env
```

En `.env` pones la URL y la clave pública de tu proyecto, que están en Supabase
en Project Settings > API Keys (la que empieza por `sb_publishable_`, nunca la
secreta). Después copias todo `supabase/esquema.sql`, lo pegas en el SQL Editor
y le das a Run: eso te crea las tablas y los permisos.

```bash
npm run dev
```

Y abres la dirección que salga en la terminal, normalmente
http://localhost:5173.

Si ya tenías la base de datos montada de antes, al final de `esquema.sql` están
apuntados los cambios que han ido llegando después, para que los apliques sueltos
sin rehacerlo todo.

El plan gratis de Supabase pausa el proyecto si pasa una semana sin uso. Para
evitarlo hay un workflow que lo toca cada día: en GitHub, en Settings > Secrets >
Actions, añade `SUPABASE_URL` y `SUPABASE_ANON_KEY` con los mismos valores del
`.env`.

## Las pruebas

Las cuentas son lo que más duele si se rompe, así que están cubiertas:

```bash
npm test
```

## Licencia

MIT. Úsalo, cámbialo y compártelo sin problema.
