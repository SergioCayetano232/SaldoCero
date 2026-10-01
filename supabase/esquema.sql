-- Esquema de SaldoCero.
-- Pegar esto en Supabase, en SQL Editor > New query, y darle a Run.

-- ---------- Tablas ----------

-- Un viaje. El código es lo que compartes con tus amigos para que entren.
create table viajes (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  -- En esta moneda se hacen las cuentas del viaje.
  moneda text not null default 'EUR',
  -- Lo que queréis gastaros como mucho, en la moneda del viaje. Null = sin tope.
  presupuesto numeric(10, 2) check (presupuesto > 0),
  -- Cerrado ya no se tocan gastos ni viajeros, solo se pagan las deudas.
  cerrado_en timestamptz,
  creado_en timestamptz not null default now()
);

create table viajeros (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references viajes(id) on delete cascade,
  nombre text not null,
  creado_en timestamptz not null default now()
);

create table gastos (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references viajes(id) on delete cascade,
  pagador_id uuid not null references viajeros(id) on delete cascade,
  -- Lo que se pagó de verdad, en la moneda en que se pagó.
  importe numeric(10, 2) not null check (importe > 0),
  moneda text not null default 'EUR',
  -- Y eso mismo pasado a la moneda del viaje, que es con lo que echamos cuentas.
  -- Lo guardamos hecho: si mañana cambia el cambio, el viaje no se descuadra.
  importe_convertido numeric(10, 2) not null check (importe_convertido > 0),
  concepto text not null,
  -- En qué se fue: comida, transporte, alojamiento...
  categoria text not null default 'otros',
  -- El día del gasto. Va aparte de creado_en porque no siempre apuntas las
  -- cosas el mismo día: la cena del viernes la metes el domingo.
  fecha date not null default current_date,
  creado_en timestamptz not null default now()
);

-- Entre quiénes se reparte cada gasto.
create table gastos_participantes (
  gasto_id uuid not null references gastos(id) on delete cascade,
  viajero_id uuid not null references viajeros(id) on delete cascade,
  -- Cuánto le toca a este del gasto. Es un peso, no un importe: con 2 y 1 uno
  -- paga el doble que el otro. A 1 todos, que es repartir a partes iguales.
  partes numeric(6, 2) not null default 1 check (partes >= 0),
  primary key (gasto_id, viajero_id)
);

-- Las deudas que ya se han pagado.
-- Los pagos no están guardados: salen de echar cuentas con los gastos. Así que
-- aquí apuntamos solo el quién a quién, que es lo que identifica a cada uno.
create table pagos_saldados (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references viajes(id) on delete cascade,
  -- Por id y no por nombre: con dos que se llamen igual se pisaban. El nombre
  -- se queda para los que se marcaron antes de esto.
  de_id uuid references viajeros(id) on delete cascade,
  a_id uuid references viajeros(id) on delete cascade,
  de_nombre text not null,
  a_nombre text not null,
  saldado_en timestamptz not null default now(),
  -- El mismo par no se puede marcar dos veces.
  unique (viaje_id, de_id, a_id)
);

-- Lo que se va pagando a cuenta: "Luis le dio 20 € a Ana", aunque no sea toda
-- la deuda. Cuenta como un gasto al revés: mueve los balances.
create table pagos_parciales (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references viajes(id) on delete cascade,
  de_id uuid not null references viajeros(id) on delete cascade,
  a_id uuid not null references viajeros(id) on delete cascade,
  importe numeric(10, 2) not null check (importe > 0),
  creado_en timestamptz not null default now(),
  check (de_id <> a_id)
);

create index on viajes (codigo);
create index on viajeros (viaje_id);
create index on gastos (viaje_id);
create index on gastos_participantes (viajero_id);
create index on pagos_saldados (viaje_id);
create index on pagos_parciales (viaje_id);

-- ---------- Quién puede ver qué ----------
--
-- No hay login: el navegador habla directo con la base de datos. Lo que hace de
-- llave es el código del viaje, que la app manda en cada petición.
--
-- La idea: no tocas NADA de un viaje si no traes su código. Ni sus gastos, ni
-- sus viajeros, ni el viaje en sí. Y no se puede listar la tabla de viajes, así
-- que tampoco puedes ir a pescar códigos.

-- El código que trae quien pregunta, sacado de la cabecera de la petición.
create function codigo_actual()
returns text
language sql
stable
as $$
  select upper(trim(
    coalesce(current_setting('request.headers', true)::json ->> 'x-codigo-viaje', '')
  ));
$$;

-- El viaje al que da acceso ese código. Null si el código no vale.
create function viaje_actual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select v.id from viajes v
  where v.codigo = codigo_actual() and codigo_actual() <> '';
$$;

-- Lo mismo, pero solo si el viaje no está cerrado. Es lo que piden los gastos y
-- los viajeros para tocarlos.
create function viaje_abierto()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select v.id from viajes v
  where v.codigo = codigo_actual() and codigo_actual() <> '' and v.cerrado_en is null;
$$;

alter table viajes enable row level security;
alter table viajeros enable row level security;
alter table gastos enable row level security;
alter table gastos_participantes enable row level security;
alter table pagos_saldados enable row level security;
alter table pagos_parciales enable row level security;

-- Del viaje y de los viajeros solo se cambian estas columnas. El código, o de
-- qué viaje es cada uno, no se tocan nunca.
revoke update on viajes from anon, authenticated;
grant update (nombre, presupuesto, cerrado_en) on viajes to anon, authenticated;
revoke update on viajeros from anon, authenticated;
grant update (nombre) on viajeros to anon, authenticated;

-- Un viaje solo se ve si traes su código. Nunca se listan todos.
create policy "ver mi viaje" on viajes for select using (id = viaje_actual());
create policy "crear un viaje" on viajes for insert with check (true);
create policy "editar mi viaje" on viajes for update
  using (id = viaje_actual()) with check (id = viaje_actual());

-- Viajeros y gastos: solo los del viaje cuyo código traes. Y para tocarlos,
-- que no esté cerrado.
create policy "ver viajeros" on viajeros for select using (viaje_id = viaje_actual());
create policy "anadir viajeros" on viajeros for insert with check (viaje_id = viaje_abierto());
create policy "quitar viajeros" on viajeros for delete using (viaje_id = viaje_abierto());
create policy "renombrar viajeros" on viajeros for update
  using (viaje_id = viaje_abierto()) with check (viaje_id = viaje_abierto());

create policy "ver gastos" on gastos for select using (viaje_id = viaje_actual());
create policy "anadir gastos" on gastos for insert with check (viaje_id = viaje_abierto());
create policy "quitar gastos" on gastos for delete using (viaje_id = viaje_abierto());
create policy "editar gastos" on gastos for update
  using (viaje_id = viaje_abierto())
  with check (viaje_id = viaje_abierto());

-- Los participantes cuelgan de un gasto, así que heredan el permiso del gasto.
create policy "ver participantes" on gastos_participantes for select using (
  exists (select 1 from gastos g where g.id = gasto_id and g.viaje_id = viaje_actual())
);
create policy "anadir participantes" on gastos_participantes for insert with check (
  exists (select 1 from gastos g where g.id = gasto_id and g.viaje_id = viaje_abierto())
);
create policy "quitar participantes" on gastos_participantes for delete using (
  exists (select 1 from gastos g where g.id = gasto_id and g.viaje_id = viaje_abierto())
);

-- Las deudas saldadas, como todo lo demás: las del viaje cuyo código traes.
create policy "ver saldados" on pagos_saldados for select using (viaje_id = viaje_actual());
-- Y los dos viajeros, de este mismo viaje.
create policy "marcar saldado" on pagos_saldados for insert with check (
  viaje_id = viaje_actual()
  and (de_id is null or exists (select 1 from viajeros v where v.id = de_id and v.viaje_id = viaje_actual()))
  and (a_id is null or exists (select 1 from viajeros v where v.id = a_id and v.viaje_id = viaje_actual()))
);
create policy "desmarcar saldado" on pagos_saldados for delete using (viaje_id = viaje_actual());

-- Los pagos a cuenta, igual. Se pueden apuntar con el viaje cerrado: las deudas
-- se pagan después de volver.
create policy "ver parciales" on pagos_parciales for select using (viaje_id = viaje_actual());
create policy "anadir parcial" on pagos_parciales for insert with check (
  viaje_id = viaje_actual()
  and exists (select 1 from viajeros v where v.id = de_id and v.viaje_id = viaje_actual())
  and exists (select 1 from viajeros v where v.id = a_id and v.viaje_id = viaje_actual())
);
create policy "quitar parcial" on pagos_parciales for delete using (viaje_id = viaje_actual());

-- ---------- Crear y abrir viajes ----------

-- Al crear un viaje hay que devolverle su código a quien lo crea, y en ese
-- momento todavía no lo tiene, así que no pasa por las reglas de arriba.
create function crear_viaje(nombre_viaje text, moneda_viaje text default 'EUR')
returns table (id uuid, codigo text, nombre text, moneda text)
language plpgsql
security definer
set search_path = public
as $$
declare
  codigo_nuevo text;
begin
  -- Código de 8 caracteres, sin las letras que se confunden (O/0, I/1).
  loop
    codigo_nuevo := (
      select string_agg(
        substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::int, 1), ''
      )
      from generate_series(1, 8)
    );
    exit when not exists (select 1 from viajes v where v.codigo = codigo_nuevo);
  end loop;

  return query
    insert into viajes (codigo, nombre, moneda)
    values (
      codigo_nuevo,
      coalesce(nullif(trim(nombre_viaje), ''), 'Mi viaje'),
      coalesce(nullif(trim(moneda_viaje), ''), 'EUR')
    )
    returning viajes.id, viajes.codigo, viajes.nombre, viajes.moneda;
end;
$$;

-- Entrar a un viaje con su código. Es la única puerta: sin código no hay id, y
-- sin id no llegas a nada.
create function abrir_viaje(codigo_buscado text)
returns table (id uuid, codigo text, nombre text, moneda text)
language sql
security definer
set search_path = public
as $$
  select v.id, v.codigo, v.nombre, v.moneda
  from viajes v
  where v.codigo = upper(trim(codigo_buscado));
$$;

-- Editar un gasto de una vez: los datos y el reparto, o todo o nada.
-- Antes eran tres peticiones, y si fallaba la última el gasto se quedaba sin
-- nadie con quien repartirse. Va con los permisos de quien llama, así que las
-- reglas de siempre (traer el código del viaje) siguen mandando.
create function editar_gasto(
  g_id uuid,
  g_pagador uuid,
  g_importe numeric,
  g_moneda text,
  g_convertido numeric,
  g_concepto text,
  g_categoria text,
  g_fecha date,
  -- [{"viajero_id": "...", "partes": 1}, ...]
  g_participantes jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if jsonb_array_length(coalesce(g_participantes, '[]'::jsonb)) = 0 then
    raise exception 'Un gasto tiene que repartirse entre alguien';
  end if;

  update gastos set
    pagador_id = g_pagador,
    importe = g_importe,
    moneda = g_moneda,
    importe_convertido = g_convertido,
    concepto = g_concepto,
    categoria = g_categoria,
    fecha = g_fecha
  where id = g_id;

  -- Si no lo ve (no existe, o es de otro viaje), no ha tocado nada.
  if not found then
    raise exception 'Ese gasto no está en este viaje';
  end if;

  delete from gastos_participantes where gasto_id = g_id;

  insert into gastos_participantes (gasto_id, viajero_id, partes)
  select g_id, (p ->> 'viajero_id')::uuid, coalesce((p ->> 'partes')::numeric, 1)
  from jsonb_array_elements(g_participantes) as p;
end;
$$;

-- Apuntar un gasto de una vez, con su reparto. Como editar_gasto: o todo o nada.
-- Antes eran dos peticiones y, si fallaba la segunda, había que borrar el gasto
-- a mano; si también fallaba eso, se quedaba suelto descuadrando las cuentas.
create function crear_gasto(
  g_viaje uuid,
  g_pagador uuid,
  g_importe numeric,
  g_moneda text,
  g_convertido numeric,
  g_concepto text,
  g_categoria text,
  g_fecha date,
  g_participantes jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  nuevo uuid;
begin
  if jsonb_array_length(coalesce(g_participantes, '[]'::jsonb)) = 0 then
    raise exception 'Un gasto tiene que repartirse entre alguien';
  end if;

  insert into gastos (viaje_id, pagador_id, importe, moneda, importe_convertido, concepto, categoria, fecha)
  values (
    g_viaje, g_pagador, g_importe,
    coalesce(g_moneda, 'EUR'), g_convertido, g_concepto,
    coalesce(g_categoria, 'otros'), coalesce(g_fecha, current_date)
  )
  returning id into nuevo;

  insert into gastos_participantes (gasto_id, viajero_id, partes)
  select nuevo, (p ->> 'viajero_id')::uuid, coalesce((p ->> 'partes')::numeric, 1)
  from jsonb_array_elements(g_participantes) as p;

  return nuevo;
end;
$$;

-- ---------- Si ya tenías la base de datos creada ----------
--
-- Lo de abajo llegó después. Si montaste las tablas antes, no hace falta
-- rehacerlo todo: corre esto en el SQL Editor y listo.

-- Editar un gasto ya apuntado.
--   create policy "editar gastos" on gastos for update
--     using (viaje_id = viaje_actual())
--     with check (viaje_id = viaje_actual());

-- Gastos en otra moneda. Los que ya había son todos en euros, así que el
-- convertido es el mismo importe.
--   alter table viajes add column moneda text not null default 'EUR';
--   alter table gastos add column moneda text not null default 'EUR';
--   alter table gastos add column importe_convertido numeric(10, 2);
--   update gastos set importe_convertido = importe where importe_convertido is null;
--   alter table gastos alter column importe_convertido set not null;
--   alter table gastos add check (importe_convertido > 0);
--
-- Y las dos funciones, que ahora devuelven también la moneda. Ojo: hay que
-- borrarlas antes, porque Postgres no deja cambiar lo que devuelve una función
-- que ya existe. Después vuelve a pegar los "create function" de más arriba.
--   drop function if exists crear_viaje(text);
--   drop function if exists abrir_viaje(text);

-- Marcar deudas como pagadas.
--   create table pagos_saldados (
--     id uuid primary key default gen_random_uuid(),
--     viaje_id uuid not null references viajes(id) on delete cascade,
--     de_nombre text not null,
--     a_nombre text not null,
--     saldado_en timestamptz not null default now(),
--     unique (viaje_id, de_nombre, a_nombre)
--   );
--   create index on pagos_saldados (viaje_id);
--   alter table pagos_saldados enable row level security;
--   create policy "ver saldados" on pagos_saldados for select using (viaje_id = viaje_actual());
--   create policy "marcar saldado" on pagos_saldados for insert with check (viaje_id = viaje_actual());
--   create policy "desmarcar saldado" on pagos_saldados for delete using (viaje_id = viaje_actual());

-- Categorías de gasto. Los que ya había se quedan en "otros".
--   alter table gastos add column categoria text not null default 'otros';

-- Reparto desigual. Lo que había se queda a partes iguales.
--   alter table gastos_participantes
--     add column partes numeric(6, 2) not null default 1 check (partes >= 0);

-- Fecha del gasto. Los que ya había se quedan con el día que se apuntaron.
--   alter table gastos add column fecha date not null default current_date;
--   update gastos set fecha = creado_en::date;

--   -- Pagos saldados por viajero y no por nombre: con dos que se llamen igual,
--   -- marcar la deuda de uno marcaba también la del otro.
--   alter table pagos_saldados
--     add column de_id uuid references viajeros(id) on delete cascade,
--     add column a_id uuid references viajeros(id) on delete cascade;
--
--   -- Los que ya había: se busca cada nombre en su viaje. Si en ese viaje hay dos
--   -- con el mismo nombre no se sabe cuál era, y se quedan solo con el nombre.
--   update pagos_saldados p set
--     de_id = (
--       select v.id from viajeros v
--       where v.viaje_id = p.viaje_id and v.nombre = p.de_nombre
--         and (select count(*) from viajeros w where w.viaje_id = p.viaje_id and w.nombre = p.de_nombre) = 1
--     ),
--     a_id = (
--       select v.id from viajeros v
--       where v.viaje_id = p.viaje_id and v.nombre = p.a_nombre
--         and (select count(*) from viajeros w where w.viaje_id = p.viaje_id and w.nombre = p.a_nombre) = 1
--     );
--
--   -- Lo que no se puede marcar dos veces ya no es el par de nombres, es el par de viajeros.
--   alter table pagos_saldados drop constraint if exists pagos_saldados_viaje_id_de_nombre_a_nombre_key;
--   alter table pagos_saldados add constraint pagos_saldados_viaje_id_de_id_a_id_key unique (viaje_id, de_id, a_id);
--
--   -- Y los dos viajeros tienen que ser de este mismo viaje. Sin id se deja pasar,
--   -- que es lo que manda la versión de la web que haya abierta mientras se despliega.
--   drop policy if exists "marcar saldado" on pagos_saldados;
--   create policy "marcar saldado" on pagos_saldados for insert with check (
--     viaje_id = viaje_actual()
--     and (de_id is null or exists (select 1 from viajeros v where v.id = de_id and v.viaje_id = viaje_actual()))
--     and (a_id is null or exists (select 1 from viajeros v where v.id = a_id and v.viaje_id = viaje_actual()))
--   );

-- Editar un gasto de una vez. Pega el "create function editar_gasto" de más arriba.

-- Apuntar un gasto de una vez. Pega el "create function crear_gasto" de más arriba.

-- Pagos a cuenta, presupuesto, renombrar y cerrar el viaje.
--   Pega el "create table pagos_parciales", su índice, su "enable row level
--   security" y sus tres policies de más arriba. Y luego:
--
--   alter table viajes add column presupuesto numeric(10, 2) check (presupuesto > 0);
--   alter table viajes add column cerrado_en timestamptz;
--
--   revoke update on viajes from anon, authenticated;
--   grant update (nombre, presupuesto, cerrado_en) on viajes to anon, authenticated;
--   revoke update on viajeros from anon, authenticated;
--   grant update (nombre) on viajeros to anon, authenticated;
--   create policy "editar mi viaje" on viajes for update
--     using (id = viaje_actual()) with check (id = viaje_actual());
--
--   Pega el "create function viaje_abierto". Después borra las policies de
--   añadir, quitar y editar de viajeros, gastos y gastos_participantes
--   (drop policy "anadir viajeros" on viajeros; ...) y créalas otra vez como
--   están arriba, con viaje_abierto(). Y la nueva "renombrar viajeros".
