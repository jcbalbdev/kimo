-- ============================================================
-- KIMO — Migration 006: Condiciones Médicas y Alergias
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- (Idempotente: se puede ejecutar varias veces sin error)
-- ============================================================

-- Si el usuario aplicó la migración incorrecta anterior, la revertimos
ALTER TABLE public.pets
  DROP COLUMN IF EXISTS allergies,
  DROP COLUMN IF EXISTS chronic_conditions;

-- 1. Crear tabla pet_medical_conditions
CREATE TABLE IF NOT EXISTS public.pet_medical_conditions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('allergy', 'chronic')),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_pet_medical_conditions_pet_id
  ON public.pet_medical_conditions(pet_id);

-- 3. Políticas de seguridad (RLS)
ALTER TABLE public.pet_medical_conditions ENABLE ROW LEVEL SECURITY;

-- Borrar políticas previas si existen para poder recrearlas sin error
DROP POLICY IF EXISTS "Users can view medical conditions of accessible pets"
  ON public.pet_medical_conditions;
DROP POLICY IF EXISTS "Users can insert medical conditions for accessible pets"
  ON public.pet_medical_conditions;
DROP POLICY IF EXISTS "Users can update medical conditions of accessible pets"
  ON public.pet_medical_conditions;
DROP POLICY IF EXISTS "Users can delete medical conditions of accessible pets"
  ON public.pet_medical_conditions;

-- Recrear políticas
CREATE POLICY "Users can view medical conditions of accessible pets"
  ON public.pet_medical_conditions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = pet_medical_conditions.pet_id
        AND pets.household_id IN (
          SELECT household_id FROM public.household_members
          WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can insert medical conditions for accessible pets"
  ON public.pet_medical_conditions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = pet_medical_conditions.pet_id
        AND pets.household_id IN (
          SELECT household_id FROM public.household_members
          WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can update medical conditions of accessible pets"
  ON public.pet_medical_conditions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = pet_medical_conditions.pet_id
        AND pets.household_id IN (
          SELECT household_id FROM public.household_members
          WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can delete medical conditions of accessible pets"
  ON public.pet_medical_conditions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = pet_medical_conditions.pet_id
        AND pets.household_id IN (
          SELECT household_id FROM public.household_members
          WHERE user_id = auth.uid()
        )
    )
  );
