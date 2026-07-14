# SaldoCero 💸

Una pequeña app web para repartir los gastos de un viaje entre amigos. Nació de
un problema de siempre: vuelves de un finde fuera y nadie se aclara con quién
pagó qué ni cuánto debe cada uno. SaldoCero lleva esas cuentas por ti.

Creas el viaje, le pasas el código a los demás y ya podéis apuntar gastos
todos desde vuestro móvil. La app te dice al momento cuánto ha puesto cada
uno, a quién le toca soltar la cartera la próxima vez y, al final, quién le
tiene que pagar a quién para que todos queden a cero.

Pruébala aquí: https://saldo-cero-eight.vercel.app/

## Qué hace

- Crear un viaje y entrar en el de otro con su código.
- Apuntar gastos desde varios móviles a la vez, en el mismo viaje.
- Añadir y quitar a los viajeros.
- Apuntar gastos indicando quién pagó, cuánto y en concepto de qué.
- Repartir un gasto solo entre algunos, que no siempre come todo el mundo.
- Calcular automáticamente el total, lo que le toca a cada uno y su balance.
- Avisar de a quién le toca pagar la próxima, que es al que menos ha puesto hasta ahora.
- Al terminar el viaje, decir quién paga a quién para saldar las cuentas.

## Cómo funcionan las cuentas

Cada gasto se reparte a partes iguales, pero solo entre la gente que va en él.
Así que voy gasto por gasto sumándole a cada participante su parte, y al final
el balance de una persona es lo que ha pagado menos lo que le tocaba. Si sale
positivo, ha puesto de más y le deben; si sale negativo, debe.

Para saldar las cuentas voy emparejando al que más debe con al que más se le
debe y paso el dinero entre ellos hasta que todos quedan a cero, buscando que
haya que hacer los menos pagos posibles.

## Con qué está hecho

- React para la interfaz.
- Vite como entorno de desarrollo.
- JavaScript y CSS puro, sin librerías de estilos.
- Supabase (Postgres) para guardar los viajes.

No hay login. Lo que hace de llave es el código del viaje: el navegador lo manda
en cada petición y las reglas de la base de datos solo te dejan tocar el viaje
al que pertenece. La lista de viajes no se puede consultar, así que no se pueden
ir pescando códigos por ahí.

## Ejecutarlo en tu ordenador

Necesitas un proyecto de Supabase, que es gratis.

```bash
git clone https://github.com/SergioCayetano232/SaldoCero.git
cd SaldoCero
npm install
cp .env.example .env
```

En `.env` pones la URL y la clave anon de tu proyecto, que están en Supabase
en Project Settings > API. Luego pegas el contenido de `supabase/esquema.sql`
en el SQL Editor y le das a Run, que eso te crea las tablas y los permisos.

```bash
npm run dev
```

Y abres la dirección que salga en la terminal, normalmente
http://localhost:5173.

## Cosas que me gustaría añadir más adelante

- Poder editar un gasto ya apuntado, no solo borrarlo y volver a meterlo.
- Que cada uno pueda poner un gasto en su moneda.
- Guardar el histórico de viajes de cada persona.

## Licencia

Este proyecto está publicado bajo la licencia MIT. Puedes usarlo, modificarlo y
compartirlo libremente.
