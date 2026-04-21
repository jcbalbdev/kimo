-- ============================================================
-- KIMO — Migration 008: Household Type + Organization fields
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Add type column to households
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'personal';

-- Add organization-specific fields
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS contact_phone text;

-- Add a check constraint (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'households_type_check'
  ) THEN
    ALTER TABLE public.households
      ADD CONSTRAINT households_type_check CHECK (type IN ('personal', 'organization'));
  END IF;
END $$;

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_households_type ON public.households(type);
