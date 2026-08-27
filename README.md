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
- Cada gasto lleva quién pagó, cuánto y en concepto de qué.
- Si un gasto no es de todos, marcas solo a los que van (no siempre come todo el mundo).
- Si te equivocas, editas el gasto y ya está.
- Te dice a quién le toca pagar la próxima: al que menos ha puesto.
- Y al final, la lista de quién paga a quién para quedar todos a cero.

## Cómo salen las cuentas

Cada gasto se divide a partes iguales, pero solo entre los que van en él. Voy
gasto por gasto sumándole a cada uno su parte, y el balance de una persona acaba
siendo lo que ha pagado menos lo que le tocaba. Si sale positivo, puso de más y
le deben. Si sale negativo, debe.

Para saldar, junto al que más debe con al que más se le debe y muevo el dinero
entre ellos hasta que todos quedan a cero. Así salen los menos pagos posibles:
mejor un Bizum de 40 que cuatro de 10.

## Con qué está hecho

React, Vite, y JavaScript y CSS a pelo, sin librerías de estilos. Los viajes se
guardan en Supabase.

No hay usuarios ni contraseñas. La llave es el código del viaje: el navegador lo
manda en cada petición y la base de datos solo te deja tocar el viaje al que
pertenece ese código. La lista de viajes no se puede consultar, así que nadie
puede ir pescando códigos.

## Ejecutarlo en tu ordenador

Necesitas una cuenta de Supabase, que es gratis.

```bash
git clone https://github.com/SergioCayetano232/SaldoCero.git
cd SaldoCero
npm install
cp .env.example .env
```

En `.env` pones la URL y la clave anon de tu proyecto, que están en Supabase en
Project Settings > API. Después copias todo `supabase/esquema.sql`, lo pegas en
el SQL Editor y le das a Run: eso te crea las tablas y los permisos.

```bash
npm run dev
```

Y abres la dirección que salga en la terminal, normalmente
http://localhost:5173.

## Lo que quiero añadir

- Que cada uno pueda meter un gasto en su moneda.
- Guardar el histórico de viajes.

## Licencia

MIT. Úsalo, cámbialo y compártelo sin problema.
