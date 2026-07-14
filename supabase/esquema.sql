-- Esquema de SaldoCero.
-- Pegar esto en Supabase, en SQL Editor > New query, y darle a Run.

-- ---------- Tablas ----------

-- Un viaje. El código es lo que compartes con tus amigos para que entren.
create table viajes (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
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
  importe numeric(10, 2) not null check (importe > 0),
  concepto text not null,
  creado_en timestamptz not null default now()
);

-- Entre quiénes se reparte cada gasto.
create table gastos_participantes (
  gasto_id uuid not null references gastos(id) on delete cascade,
  viajero_id uuid not null references viajeros(id) on delete cascade,
  primary key (gasto_id, viajero_id)
);

create index on viajes (codigo);
create index on viajeros (viaje_id);
create index on gastos (viaje_id);
create index on gastos_participantes (viajero_id);

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

alter table viajes enable row level security;
alter table viajeros enable row level security;
alter table gastos enable row level security;
alter table gastos_participantes enable row level security;

-- Un viaje solo se ve si traes su código. Nunca se listan todos.
create policy "ver mi viaje" on viajes for select using (id = viaje_actual());
create policy "crear un viaje" on viajes for insert with check (true);

-- Viajeros y gastos: solo los del viaje cuyo código traes.
create policy "ver viajeros" on viajeros for select using (viaje_id = viaje_actual());
create policy "anadir viajeros" on viajeros for insert with check (viaje_id = viaje_actual());
create policy "quitar viajeros" on viajeros for delete using (viaje_id = viaje_actual());

create policy "ver gastos" on gastos for select using (viaje_id = viaje_actual());
create policy "anadir gastos" on gastos for insert with check (viaje_id = viaje_actual());
create policy "quitar gastos" on gastos for delete using (viaje_id = viaje_actual());

-- Los participantes cuelgan de un gasto, así que heredan el permiso del gasto.
create policy "ver participantes" on gastos_participantes for select using (
  exists (select 1 from gastos g where g.id = gasto_id and g.viaje_id = viaje_actual())
);
create policy "anadir participantes" on gastos_participantes for insert with check (
  exists (select 1 from gastos g where g.id = gasto_id and g.viaje_id = viaje_actual())
);
create policy "quitar participantes" on gastos_participantes for delete using (
  exists (select 1 from gastos g where g.id = gasto_id and g.viaje_id = viaje_actual())
);

-- ---------- Crear y abrir viajes ----------

-- Al crear un viaje hay que devolverle su código a quien lo crea, y en ese
-- momento todavía no lo tiene, así que no pasa por las reglas de arriba.
create function crear_viaje(nombre_viaje text)
returns table (id uuid, codigo text, nombre text)
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
    insert into viajes (codigo, nombre)
    values (codigo_nuevo, coalesce(nullif(trim(nombre_viaje), ''), 'Mi viaje'))
    returning viajes.id, viajes.codigo, viajes.nombre;
end;
$$;

-- Entrar a un viaje con su código. Es la única puerta: sin código no hay id, y
-- sin id no llegas a nada.
create function abrir_viaje(codigo_buscado text)
returns table (id uuid, codigo text, nombre text)
language sql
security definer
set search_path = public
as $$
  select v.id, v.codigo, v.nombre
  from viajes v
  where v.codigo = upper(trim(codigo_buscado));
$$;
