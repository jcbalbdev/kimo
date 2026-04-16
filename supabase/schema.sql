-- ==============================================
-- MiKimo — Schema completo para Supabase
-- Ejecutar en SQL Editor de Supabase Dashboard
-- ==============================================
-- IMPORTANTE: Primero tablas, luego policies

-- =====================
-- PARTE 1: CREAR TABLAS
-- =====================

-- 1. Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '',
  avatar_emoji text not null default '😊',
  created_at timestamptz not null default now()
);

-- 2. Households
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default encode(gen_random_bytes(4), 'hex'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3. Household Members
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique(household_id, user_id)
);

-- 4. Pets
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade not null,
  name text not null,
  species text not null default 'dog',
  custom_species text,
  avatar_emoji text not null default '🐾',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 5. Medications
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references public.pets(id) on delete cascade not null,
  name text not null,
  dose text,
  frequency text not null default 'daily',
  custom_frequency text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 6. Medication Checks
create table if not exists public.medication_checks (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid references public.medications(id) on delete cascade not null,
  date date not null default current_date,
  taken boolean not null default true,
  checked_by uuid references public.profiles(id) on delete set null,
  checked_at timestamptz not null default now(),
  unique(medication_id, date)
);

-- 7. Feedings
create table if not exists public.feedings (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references public.pets(id) on delete cascade not null,
  brand text,
  amount text,
  reaction text not null default 'ate_all' check (reaction in ('ate_all', 'ate_little', 'didnt_eat', 'vomited')),
  notes text,
  date date not null default current_date,
  time time not null default current_time,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 8. Appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references public.pets(id) on delete cascade not null,
  title text not null,
  vet_name text,
  vet_location text,
  date date not null,
  time time,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 9. Weight Logs
create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references public.pets(id) on delete cascade not null,
  weight numeric not null,
  unit text not null default 'kg',
  date date not null default current_date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ========================
-- PARTE 2: TRIGGER PROFILE
-- ========================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- PARTE 3: ENABLE RLS
-- =====================

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.pets enable row level security;
alter table public.medications enable row level security;
alter table public.medication_checks enable row level security;
alter table public.feedings enable row level security;
alter table public.appointments enable row level security;
alter table public.weight_logs enable row level security;

-- =====================
-- PARTE 4: POLICIES
-- =====================

-- Profiles policies
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_select_household" on public.profiles for select using (
  id in (
    select hm.user_id from public.household_members hm
    where hm.household_id in (
      select hm2.household_id from public.household_members hm2 where hm2.user_id = auth.uid()
    )
  )
);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);

-- Households policies
create policy "households_select" on public.households for select using (true);
create policy "households_insert" on public.households for insert with check (auth.uid() is not null);
create policy "households_update" on public.households for update using (created_by = auth.uid());
create policy "households_delete" on public.households for delete using (created_by = auth.uid());

-- Household Members policies
create policy "hm_select" on public.household_members for select using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);
create policy "hm_insert" on public.household_members for insert with check (auth.uid() = user_id);
create policy "hm_delete_own" on public.household_members for delete using (user_id = auth.uid());

-- Pets policies
create policy "pets_select" on public.pets for select using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);
create policy "pets_insert" on public.pets for insert with check (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);
create policy "pets_update" on public.pets for update using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);
create policy "pets_delete" on public.pets for delete using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

-- Medications policies
create policy "meds_select" on public.medications for select using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "meds_insert" on public.medications for insert with check (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "meds_update" on public.medications for update using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "meds_delete" on public.medications for delete using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);

-- Medication Checks policies
create policy "checks_select" on public.medication_checks for select using (
  medication_id in (select m.id from public.medications m join public.pets p on p.id = m.pet_id join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "checks_insert" on public.medication_checks for insert with check (
  medication_id in (select m.id from public.medications m join public.pets p on p.id = m.pet_id join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "checks_update" on public.medication_checks for update using (
  medication_id in (select m.id from public.medications m join public.pets p on p.id = m.pet_id join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "checks_delete" on public.medication_checks for delete using (
  medication_id in (select m.id from public.medications m join public.pets p on p.id = m.pet_id join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);

-- Feedings policies
create policy "feeds_select" on public.feedings for select using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "feeds_insert" on public.feedings for insert with check (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "feeds_update" on public.feedings for update using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "feeds_delete" on public.feedings for delete using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);

-- Appointments policies
create policy "appts_select" on public.appointments for select using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "appts_insert" on public.appointments for insert with check (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "appts_update" on public.appointments for update using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "appts_delete" on public.appointments for delete using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);

-- Weight Logs policies
create policy "weight_select" on public.weight_logs for select using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "weight_insert" on public.weight_logs for insert with check (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "weight_update" on public.weight_logs for update using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);
create policy "weight_delete" on public.weight_logs for delete using (
  pet_id in (select p.id from public.pets p join public.household_members hm on hm.household_id = p.household_id where hm.user_id = auth.uid())
);

-- =====================
-- PARTE 5: INDEXES
-- =====================
create index if not exists idx_hm_user on public.household_members(user_id);
create index if not exists idx_hm_household on public.household_members(household_id);
create index if not exists idx_pets_household on public.pets(household_id);
create index if not exists idx_meds_pet on public.medications(pet_id);
create index if not exists idx_checks_med on public.medication_checks(medication_id);
create index if not exists idx_checks_date on public.medication_checks(date);
create index if not exists idx_feeds_pet on public.feedings(pet_id);
create index if not exists idx_feeds_date on public.feedings(date);
create index if not exists idx_appts_pet on public.appointments(pet_id);
create index if not exists idx_appts_date on public.appointments(date);
create index if not exists idx_weight_pet on public.weight_logs(pet_id);
create index if not exists idx_weight_date on public.weight_logs(date);
create index if not exists idx_hh_invite on public.households(invite_code);
