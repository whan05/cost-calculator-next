-- ==========================================================
-- Migración Inicial: Calculadora de Costos de Productos y Servicios
-- Base de datos: PostgreSQL (Supabase)
-- ==========================================================

-- Habilitar extensión pgcrypto para gen_random_uuid si no está habilitada
create extension if not exists "pgcrypto";

-- 1. Tabla de Perfiles de Usuario (profiles)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  business_name text,
  currency text not null default 'CRC',
  default_hourly_rate numeric(12, 4) not null default 0.0000 check (default_hourly_rate >= 0),
  default_profit_percentage numeric(8, 4) not null default 30.0000 check (default_profit_percentage >= 0),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 2. Categorías de Materiales (material_categories)
create table if not exists public.material_categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 3. Catálogo de Materiales e Insumos (materials)
create table if not exists public.materials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.material_categories(id) on delete set null,
  name text not null,
  description text,
  unit text not null,
  purchased_quantity numeric(14, 4) not null check (purchased_quantity > 0),
  total_purchase_cost numeric(14, 4) not null check (total_purchase_cost >= 0),
  unit_cost numeric(14, 4) not null check (unit_cost >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 4. Cálculos Guardados (calculations: Productos y Servicios)
create table if not exists public.calculations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('product', 'service')),
  name text not null,
  description text,
  output_quantity numeric(14, 4) not null check (output_quantity > 0),
  work_minutes numeric(12, 2) not null check (work_minutes >= 0),
  hourly_rate numeric(14, 4) not null check (hourly_rate >= 0),
  labor_cost numeric(14, 4) not null check (labor_cost >= 0),
  materials_cost numeric(14, 4) not null check (materials_cost >= 0),
  additional_cost numeric(14, 4) not null check (additional_cost >= 0),
  total_cost numeric(14, 4) not null check (total_cost >= 0),
  unit_cost numeric(14, 4) not null check (unit_cost >= 0),
  profit_percentage numeric(8, 4) not null check (profit_percentage >= 0),
  profit_method text not null check (profit_method in ('markup', 'margin')),
  suggested_unit_price numeric(14, 4) not null check (suggested_unit_price >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 5. Materiales utilizados en cálculos con Snapshot Histórico Inmutable
create table if not exists public.calculation_materials (
  id uuid default gen_random_uuid() primary key,
  calculation_id uuid not null references public.calculations(id) on delete cascade,
  material_id uuid references public.materials(id) on delete set null,
  material_name_snapshot text not null,
  unit_snapshot text not null,
  quantity_used numeric(14, 4) not null check (quantity_used >= 0),
  unit_cost_snapshot numeric(14, 4) not null check (unit_cost_snapshot >= 0),
  subtotal numeric(14, 4) not null check (subtotal >= 0)
);

-- 6. Gastos Adicionales en cálculos
create table if not exists public.calculation_expenses (
  id uuid default gen_random_uuid() primary key,
  calculation_id uuid not null references public.calculations(id) on delete cascade,
  name text not null,
  amount numeric(14, 4) not null check (amount >= 0)
);

-- ==========================================================
-- Índices para optimización de consultas
-- ==========================================================
create index if not exists idx_material_categories_user_id on public.material_categories(user_id);
create index if not exists idx_materials_user_id on public.materials(user_id);
create index if not exists idx_materials_category_id on public.materials(category_id);
create index if not exists idx_materials_is_archived on public.materials(is_archived);
create index if not exists idx_materials_created_at on public.materials(created_at desc);

create index if not exists idx_calculations_user_id on public.calculations(user_id);
create index if not exists idx_calculations_type on public.calculations(type);
create index if not exists idx_calculations_is_archived on public.calculations(is_archived);
create index if not exists idx_calculations_created_at on public.calculations(created_at desc);

create index if not exists idx_calculation_materials_calc_id on public.calculation_materials(calculation_id);
create index if not exists idx_calculation_expenses_calc_id on public.calculation_expenses(calculation_id);

-- ==========================================================
-- Triggers para updated_at automático
-- ==========================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger trigger_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trigger_materials_updated_at
  before update on public.materials
  for each row execute function public.set_updated_at();

create trigger trigger_calculations_updated_at
  before update on public.calculations
  for each row execute function public.set_updated_at();

-- Trigger para creación automática de perfil al registrarse en auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, business_name, currency, default_hourly_rate, default_profit_percentage)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'business_name', ''),
    coalesce(new.raw_user_meta_data->>'currency', 'CRC'),
    coalesce((new.raw_user_meta_data->>'default_hourly_rate')::numeric, 0),
    coalesce((new.raw_user_meta_data->>'default_profit_percentage')::numeric, 30)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==========================================================
-- Políticas Row Level Security (RLS)
-- ==========================================================

-- Habilitar RLS en todas las tablas
alter table public.profiles enable row level security;
alter table public.material_categories enable row level security;
alter table public.materials enable row level security;
alter table public.calculations enable row level security;
alter table public.calculation_materials enable row level security;
alter table public.calculation_expenses enable row level security;

-- Políticas para profiles
create policy "Los usuarios pueden ver su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Los usuarios pueden insertar su propio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Los usuarios pueden actualizar su propio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Políticas para material_categories
create policy "Los usuarios pueden ver sus categorías"
  on public.material_categories for select
  using (auth.uid() = user_id);

create policy "Los usuarios pueden crear sus categorías"
  on public.material_categories for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios pueden actualizar sus categorías"
  on public.material_categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Los usuarios pueden eliminar sus categorías"
  on public.material_categories for delete
  using (auth.uid() = user_id);

-- Políticas para materials
create policy "Los usuarios pueden ver sus materiales"
  on public.materials for select
  using (auth.uid() = user_id);

create policy "Los usuarios pueden crear sus materiales"
  on public.materials for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios pueden actualizar sus materiales"
  on public.materials for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Los usuarios pueden eliminar sus materiales"
  on public.materials for delete
  using (auth.uid() = user_id);

-- Políticas para calculations
create policy "Los usuarios pueden ver sus cálculos"
  on public.calculations for select
  using (auth.uid() = user_id);

create policy "Los usuarios pueden crear sus cálculos"
  on public.calculations for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios pueden actualizar sus cálculos"
  on public.calculations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Los usuarios pueden eliminar sus cálculos"
  on public.calculations for delete
  using (auth.uid() = user_id);

-- Políticas para calculation_materials (Depende del propietario del cálculo)
create policy "Los usuarios pueden ver los materiales de sus cálculos"
  on public.calculation_materials for select
  using (
    exists (
      select 1 from public.calculations
      where calculations.id = calculation_materials.calculation_id
        and calculations.user_id = auth.uid()
    )
  );

create policy "Los usuarios pueden insertar materiales en sus cálculos"
  on public.calculation_materials for insert
  with check (
    exists (
      select 1 from public.calculations
      where calculations.id = calculation_materials.calculation_id
        and calculations.user_id = auth.uid()
    )
  );

create policy "Los usuarios pueden actualizar materiales de sus cálculos"
  on public.calculation_materials for update
  using (
    exists (
      select 1 from public.calculations
      where calculations.id = calculation_materials.calculation_id
        and calculations.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.calculations
      where calculations.id = calculation_materials.calculation_id
        and calculations.user_id = auth.uid()
    )
  );

create policy "Los usuarios pueden eliminar materiales de sus cálculos"
  on public.calculation_materials for delete
  using (
    exists (
      select 1 from public.calculations
      where calculations.id = calculation_materials.calculation_id
        and calculations.user_id = auth.uid()
    )
  );

-- Políticas para calculation_expenses (Depende del propietario del cálculo)
create policy "Los usuarios pueden ver los gastos de sus cálculos"
  on public.calculation_expenses for select
  using (
    exists (
      select 1 from public.calculations
      where calculations.id = calculation_expenses.calculation_id
        and calculations.user_id = auth.uid()
    )
  );

create policy "Los usuarios pueden insertar gastos en sus cálculos"
  on public.calculation_expenses for insert
  with check (
    exists (
      select 1 from public.calculations
      where calculations.id = calculation_expenses.calculation_id
        and calculations.user_id = auth.uid()
    )
  );

create policy "Los usuarios pueden actualizar gastos de sus cálculos"
  on public.calculation_expenses for update
  using (
    exists (
      select 1 from public.calculations
      where calculations.id = calculation_expenses.calculation_id
        and calculations.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.calculations
      where calculations.id = calculation_expenses.calculation_id
        and calculations.user_id = auth.uid()
    )
  );

create policy "Los usuarios pueden eliminar gastos de sus cálculos"
  on public.calculation_expenses for delete
  using (
    exists (
      select 1 from public.calculations
      where calculations.id = calculation_expenses.calculation_id
        and calculations.user_id = auth.uid()
    )
  );

