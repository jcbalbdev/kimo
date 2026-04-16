-- ============================================================
-- KIMO — Migration 003: Vaccines overhaul + vaccine_checks table
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- ============================================================

-- ── 1. Ensure vaccines table exists ───────────────────────
CREATE TABLE IF NOT EXISTS public.vaccines (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references public.pets(id) on delete cascade not null,
  name text not null,
  date date not null default CURRENT_DATE,
  next_date date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;

-- RLS for vaccines (if not already there)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='vaccines' AND policyname='vax_select'
  ) THEN
    CREATE POLICY "vax_select" ON public.vaccines FOR SELECT USING (
      pet_id IN (SELECT p.id FROM public.pets p JOIN public.household_members hm ON hm.household_id = p.household_id WHERE hm.user_id = auth.uid())
    );
    CREATE POLICY "vax_insert" ON public.vaccines FOR INSERT WITH CHECK (
      pet_id IN (SELECT p.id FROM public.pets p JOIN public.household_members hm ON hm.household_id = p.household_id WHERE hm.user_id = auth.uid())
    );
    CREATE POLICY "vax_update" ON public.vaccines FOR UPDATE USING (
      pet_id IN (SELECT p.id FROM public.pets p JOIN public.household_members hm ON hm.household_id = p.household_id WHERE hm.user_id = auth.uid())
    );
    CREATE POLICY "vax_delete" ON public.vaccines FOR DELETE USING (
      pet_id IN (SELECT p.id FROM public.pets p JOIN public.household_members hm ON hm.household_id = p.household_id WHERE hm.user_id = auth.uid())
    );
  END IF;
END $$;

-- ── 2. Add scheduling columns to vaccines ─────────────────
ALTER TABLE public.vaccines
  ADD COLUMN IF NOT EXISTS interval_days integer,
  ADD COLUMN IF NOT EXISTS repeats boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz;

-- ── 3. Create vaccine_checks table ────────────────────────
CREATE TABLE IF NOT EXISTS public.vaccine_checks (
  id uuid primary key default gen_random_uuid(),
  vaccine_id uuid references public.vaccines(id) on delete cascade not null,
  scheduled_date date not null,
  taken boolean not null default true,
  checked_by uuid references public.profiles(id) on delete set null,
  checked_at timestamptz not null default now(),
  CONSTRAINT vc_unique_slot UNIQUE (vaccine_id, scheduled_date)
);

ALTER TABLE public.vaccine_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vc_select" ON public.vaccine_checks FOR SELECT USING (
  vaccine_id IN (
    SELECT v.id FROM public.vaccines v
    JOIN public.pets p ON p.id = v.pet_id
    JOIN public.household_members hm ON hm.household_id = p.household_id
    WHERE hm.user_id = auth.uid()
  )
);
CREATE POLICY "vc_insert" ON public.vaccine_checks FOR INSERT WITH CHECK (
  vaccine_id IN (
    SELECT v.id FROM public.vaccines v
    JOIN public.pets p ON p.id = v.pet_id
    JOIN public.household_members hm ON hm.household_id = p.household_id
    WHERE hm.user_id = auth.uid()
  )
);
CREATE POLICY "vc_delete" ON public.vaccine_checks FOR DELETE USING (
  vaccine_id IN (
    SELECT v.id FROM public.vaccines v
    JOIN public.pets p ON p.id = v.pet_id
    JOIN public.household_members hm ON hm.household_id = p.household_id
    WHERE hm.user_id = auth.uid()
  )
);

-- ── 4. Indexes ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vaccines_pet ON public.vaccines(pet_id);
CREATE INDEX IF NOT EXISTS idx_vc_vaccine ON public.vaccine_checks(vaccine_id);
CREATE INDEX IF NOT EXISTS idx_vc_date ON public.vaccine_checks(scheduled_date);
