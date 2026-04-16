-- ============================================================
-- KIMO — Migration 002: Gender, sterilized & medication schedule
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- ============================================================

-- ── 1. Pets: gender + sterilized ──────────────────────────
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS sterilized boolean;

-- ── 2. Medications: scheduling columns ────────────────────
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS start_time time DEFAULT '08:00:00',
  ADD COLUMN IF NOT EXISTS interval_hours numeric NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz;

-- ── 3. Medication checks: slot-based tracking ─────────────
-- Add scheduled_at to identify the specific dose slot
ALTER TABLE public.medication_checks
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- Drop old unique constraint ( medication_id + date ) since
-- medications can now have multiple doses per day.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.medication_checks'::regclass
    AND conname = 'medication_checks_medication_id_date_key'
  ) THEN
    ALTER TABLE public.medication_checks
      DROP CONSTRAINT medication_checks_medication_id_date_key;
  END IF;
END $$;

-- New unique constraint: one check per medication per scheduled slot
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.medication_checks'::regclass
    AND conname = 'mc_unique_slot'
  ) THEN
    ALTER TABLE public.medication_checks
      ADD CONSTRAINT mc_unique_slot UNIQUE (medication_id, scheduled_at);
  END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_checks_scheduled
  ON public.medication_checks(scheduled_at);
