-- ================================================
-- MiKimo — FIX COMPLETO DE RLS
-- Elimina TODAS las policies y las recrea usando
-- funciones SECURITY DEFINER (que ignoran RLS),
-- eliminando cualquier referencia circular.
-- ================================================

-- =====================
-- PASO 1: BORRAR TODAS LAS POLICIES EXISTENTES
-- =====================

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select_household" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;

-- households
drop policy if exists "households_select" on public.households;
drop policy if exists "households_insert" on public.households;
drop policy if exists "households_update" on public.households;
drop policy if exists "households_delete" on public.households;

-- household_members
drop policy if exists "hm_select" on public.household_members;
drop policy if exists "hm_select_same_household" on public.household_members;
drop policy if exists "hm_insert" on public.household_members;
drop policy if exists "hm_delete_own" on public.household_members;

-- pets
drop policy if exists "pets_select" on public.pets;
drop policy if exists "pets_insert" on public.pets;
drop policy if exists "pets_update" on public.pets;
drop policy if exists "pets_delete" on public.pets;

-- medications
drop policy if exists "meds_select" on public.medications;
drop policy if exists "meds_insert" on public.medications;
drop policy if exists "meds_update" on public.medications;
drop policy if exists "meds_delete" on public.medications;

-- medication_checks
drop policy if exists "checks_select" on public.medication_checks;
drop policy if exists "checks_insert" on public.medication_checks;
drop policy if exists "checks_update" on public.medication_checks;
drop policy if exists "checks_delete" on public.medication_checks;

-- feedings
drop policy if exists "feeds_select" on public.feedings;
drop policy if exists "feeds_insert" on public.feedings;
drop policy if exists "feeds_update" on public.feedings;
drop policy if exists "feeds_delete" on public.feedings;

-- appointments
drop policy if exists "appts_select" on public.appointments;
drop policy if exists "appts_insert" on public.appointments;
drop policy if exists "appts_update" on public.appointments;
drop policy if exists "appts_delete" on public.appointments;

-- weight_logs
drop policy if exists "weight_select" on public.weight_logs;
drop policy if exists "weight_insert" on public.weight_logs;
drop policy if exists "weight_update" on public.weight_logs;
drop policy if exists "weight_delete" on public.weight_logs;

-- =====================
-- PASO 2: FUNCIONES HELPER (SECURITY DEFINER = ignoran RLS)
-- Estas funciones consultan las tablas directamente
-- sin pasar por RLS, rompiendo cualquier ciclo.
-- =====================

create or replace function public.get_my_household_ids()
returns setof uuid language sql security definer stable
as $$
  select household_id from public.household_members where user_id = auth.uid();
$$;

create or replace function public.get_my_household_member_ids()
returns setof uuid language sql security definer stable
as $$
  select user_id from public.household_members
  where household_id in (
    select household_id from public.household_members where user_id = auth.uid()
  );
$$;

create or replace function public.get_my_pet_ids()
returns setof uuid language sql security definer stable
as $$
  select id from public.pets
  where household_id in (
    select household_id from public.household_members where user_id = auth.uid()
  );
$$;

create or replace function public.get_my_medication_ids()
returns setof uuid language sql security definer stable
as $$
  select m.id from public.medications m
  join public.pets p on p.id = m.pet_id
  where p.household_id in (
    select household_id from public.household_members where user_id = auth.uid()
  );
$$;

-- =====================
-- PASO 3: RECREAR POLICIES (todas usan funciones, CERO referencias circulares)
-- =====================

-- PROFILES
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_select_household" on public.profiles for select using (
  id in (select public.get_my_household_member_ids())
);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);

-- HOUSEHOLDS
create policy "households_select" on public.households for select using (true);
create policy "households_insert" on public.households for insert with check (auth.uid() is not null);
create policy "households_update" on public.households for update using (created_by = auth.uid());
create policy "households_delete" on public.households for delete using (created_by = auth.uid());

-- HOUSEHOLD_MEMBERS (usa función, NO se referencia a sí misma)
create policy "hm_select" on public.household_members for select using (
  household_id in (select public.get_my_household_ids())
);
create policy "hm_insert" on public.household_members for insert with check (auth.uid() = user_id);
create policy "hm_delete_own" on public.household_members for delete using (user_id = auth.uid());

-- PETS
create policy "pets_select" on public.pets for select using (household_id in (select public.get_my_household_ids()));
create policy "pets_insert" on public.pets for insert with check (household_id in (select public.get_my_household_ids()));
create policy "pets_update" on public.pets for update using (household_id in (select public.get_my_household_ids()));
create policy "pets_delete" on public.pets for delete using (household_id in (select public.get_my_household_ids()));

-- MEDICATIONS
create policy "meds_select" on public.medications for select using (pet_id in (select public.get_my_pet_ids()));
create policy "meds_insert" on public.medications for insert with check (pet_id in (select public.get_my_pet_ids()));
create policy "meds_update" on public.medications for update using (pet_id in (select public.get_my_pet_ids()));
create policy "meds_delete" on public.medications for delete using (pet_id in (select public.get_my_pet_ids()));

-- MEDICATION_CHECKS
create policy "checks_select" on public.medication_checks for select using (medication_id in (select public.get_my_medication_ids()));
create policy "checks_insert" on public.medication_checks for insert with check (medication_id in (select public.get_my_medication_ids()));
create policy "checks_update" on public.medication_checks for update using (medication_id in (select public.get_my_medication_ids()));
create policy "checks_delete" on public.medication_checks for delete using (medication_id in (select public.get_my_medication_ids()));

-- FEEDINGS
create policy "feeds_select" on public.feedings for select using (pet_id in (select public.get_my_pet_ids()));
create policy "feeds_insert" on public.feedings for insert with check (pet_id in (select public.get_my_pet_ids()));
create policy "feeds_update" on public.feedings for update using (pet_id in (select public.get_my_pet_ids()));
create policy "feeds_delete" on public.feedings for delete using (pet_id in (select public.get_my_pet_ids()));

-- APPOINTMENTS
create policy "appts_select" on public.appointments for select using (pet_id in (select public.get_my_pet_ids()));
create policy "appts_insert" on public.appointments for insert with check (pet_id in (select public.get_my_pet_ids()));
create policy "appts_update" on public.appointments for update using (pet_id in (select public.get_my_pet_ids()));
create policy "appts_delete" on public.appointments for delete using (pet_id in (select public.get_my_pet_ids()));

-- WEIGHT_LOGS
create policy "weight_select" on public.weight_logs for select using (pet_id in (select public.get_my_pet_ids()));
create policy "weight_insert" on public.weight_logs for insert with check (pet_id in (select public.get_my_pet_ids()));
create policy "weight_update" on public.weight_logs for update using (pet_id in (select public.get_my_pet_ids()));
create policy "weight_delete" on public.weight_logs for delete using (pet_id in (select public.get_my_pet_ids()));
