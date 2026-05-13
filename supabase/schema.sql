-- =============================================================
-- SCHEMA: Canje Calendar
-- =============================================================
-- Pegar TODO este archivo en: Supabase Dashboard → SQL Editor → New Query → Run
-- Una sola vez al inicio. Si ya está corrido, no hace falta repetir.

-- ENUMS ---------------------------------------------------------
do $$ begin
  create type task_status as enum ('todo', 'doing', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

-- PROFILES ------------------------------------------------------
-- Tabla complementaria a auth.users con datos visibles del equipo
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  color text not null default '#d9962a',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cualquier autenticado puede leer perfiles del equipo (para asignar tareas)
drop policy if exists "profiles_read_all_auth" on public.profiles;
create policy "profiles_read_all_auth"
  on public.profiles for select
  to authenticated
  using (true);

-- Cada usuario puede actualizar SOLO su propio perfil
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Insertar perfil propio (lo dispara el trigger de abajo)
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Trigger: cuando se crea un user en auth.users, crear su perfil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, color)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'color', '#d9962a')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- TASKS ---------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  task_date date not null,
  task_time time,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  tags text[] not null default '{}',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_date_idx on public.tasks(task_date);
create index if not exists tasks_assigned_idx on public.tasks(assigned_to);

alter table public.tasks enable row level security;

-- El equipo (cualquier autenticado) puede ver TODAS las tareas
drop policy if exists "tasks_read_team" on public.tasks;
create policy "tasks_read_team"
  on public.tasks for select
  to authenticated
  using (true);

-- Cualquier autenticado puede crear tareas (se queda como created_by)
drop policy if exists "tasks_insert_auth" on public.tasks;
create policy "tasks_insert_auth"
  on public.tasks for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Editar: solo el creador o el asignado
drop policy if exists "tasks_update_creator_or_assignee" on public.tasks;
create policy "tasks_update_creator_or_assignee"
  on public.tasks for update
  to authenticated
  using (auth.uid() = created_by or auth.uid() = assigned_to);

-- Borrar: solo el creador
drop policy if exists "tasks_delete_creator" on public.tasks;
create policy "tasks_delete_creator"
  on public.tasks for delete
  to authenticated
  using (auth.uid() = created_by);

-- Trigger: actualizar updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_touch_updated_at on public.tasks;
create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute function public.touch_updated_at();
