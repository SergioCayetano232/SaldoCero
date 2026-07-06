# SaldoCero 💸

Una pequeña app web para repartir los gastos de un viaje entre amigos. Nació de
un problema de siempre: vuelves de un finde fuera y nadie se aclara con quién
pagó qué ni cuánto debe cada uno. SaldoCero lleva esas cuentas por ti.

Añades a la gente del viaje, vas apuntando los gastos según quién paga cada
cosa, y la app te dice al momento cuánto ha puesto cada uno, a quién le toca
soltar la cartera la próxima vez y, al final, quién le tiene que pagar a quién
para que todos queden a cero.

Pruébala aquí: https://saldo-cero-eight.vercel.app/

## Qué hace

- Añadir y quitar a los viajeros.
- Apuntar gastos indicando quién pagó, cuánto y en concepto de qué.
- Calcular automáticamente el total, lo que le toca a cada uno y su balance.
- Avisar de a quién le toca pagar la próxima, que es al que menos ha puesto hasta ahora.
- Al terminar el viaje, decir quién paga a quién para saldar las cuentas.
- Guardar todo en el navegador, para que no se pierda al recargar la página.
- Un botón para empezar de cero cuando arranca un viaje nuevo.

## Cómo funcionan las cuentas

Parto de que todos comparten los gastos a partes iguales. Con eso, para cada
persona calculo su balance: lo que ha pagado menos lo que le tocaría pagar,
es decir, el total dividido entre el número de viajeros. Si el balance sale
positivo, ha puesto de más y le deben; si sale negativo, debe.

Para saldar las cuentas voy emparejando al que más debe con al que más se le
debe y paso el dinero entre ellos hasta que todos quedan a cero, buscando que
haya que hacer los menos pagos posibles.

## Con qué está hecho

- React para la interfaz.
- Vite como entorno de desarrollo.
- JavaScript y CSS puro, sin librerías de estilos.
- localStorage para guardar los datos en el navegador.

Lo monté sin base de datos a propósito, para centrarme en la lógica del reparto
y en manejar bien el estado de React.

## Ejecutarlo en tu ordenador

```bash
git clone https://github.com/SergioCayetano232/SaldoCero.git
cd SaldoCero
npm install
npm run dev
```

Y abres la dirección que salga en la terminal, normalmente
http://localhost:5173.

## Cosas que me gustaría añadir más adelante

- Poder compartir un mismo viaje entre varios móviles, que necesitaría una base
  de datos en la nube.
- Que un gasto se pueda repartir solo entre algunas personas, no siempre entre
  todas.
- Guardar varios viajes distintos.

## Licencia

Este proyecto está publicado bajo la licencia MIT. Puedes usarlo, modificarlo y
compartirlo libremente.
