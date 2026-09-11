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
- Todos apuntáis gastos a la vez, cada uno desde su móvil.
- Cada gasto lleva quién pagó, cuánto, en qué día y en concepto de qué.
- Marcas cuál de los viajeros eres tú y te resalta tus cuentas.
- Cada gasto va en una categoría, y el resumen te dice en qué se va el dinero.
- Si un gasto no es de todos, marcas solo a los que van.
- Y si uno come el doble que los demás, lo repartes en partes desiguales.
- Si te equivocas, editas el gasto y ya está.
- Si borras algo sin querer, lo deshaces.
- Puedes pagar en otra moneda y te lo convertimos a la del viaje.
- Te dice a quién le toca pagar la próxima: al que menos ha puesto.
- Y al final, la lista de quién paga a quién para quedar todos a cero.
- Vas marcando las deudas que ya se han pagado.
- El resumen lo compartes por donde quieras o te lo descargas en un txt.
- Guarda los viajes en los que has estado, para volver sin buscar el código.


## Se instala en el móvil

Es una PWA, así que puedes añadirla a la pantalla de inicio y se abre como una
app más, sin barra del navegador.

Sin internet abre igual, pero solo la app: los gastos no los guardamos en el
móvil a propósito. Un viaje lo van tocando varios a la vez, y enseñarte unas
cuentas viejas sin avisar sería peor que decirte que no hay conexión.

## Lo de las monedas

Cada viaje tiene la suya, y es en la que se hacen todas las cuentas. Si pagas en
otra, te pedimos el cambio y **guardamos las dos cifras**: lo que pagaste de
verdad y lo que sale en la moneda del viaje.

Lo guardo convertido a propósito. Si lo calculara al mostrarlo, el cambio de hoy
te movería las cuentas de un viaje de hace tres meses, y eso no tiene sentido:
lo que pagaste, pagado está.

El cambio lo da [Frankfurter](https://frankfurter.dev), que es gratis y no pide
registrarse. Solo trae las monedas del Banco Central Europeo, así que están el
euro, la libra o el yen, pero no el dirham ni el peso colombiano. Si no hay
internet, te avisa y lo apuntas en la moneda del viaje.

## Con qué está hecho

React, Vite, y JavaScript y CSS , sin librerías de estilos. Los viajes se
guardan en Supabase, y un service worker de treinta líneas es todo lo que hace
falta para lo de instalarla.

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

## Las pruebas

Las cuentas son lo que más duele si se rompe, así que están cubiertas:

```bash
npm test
```

## Licencia

MIT. Úsalo, cámbialo y compártelo sin problema.
