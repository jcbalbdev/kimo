-- ============================================================
-- KIMO — Migration 013: Public pet profile read access
-- Permite lectura pública de mascotas y sus datos clínicos
-- para la página de perfil compartida (/pet/:id)
-- ============================================================

-- 1. Pets — lectura pública por id
DROP POLICY IF EXISTS "Public can read pets by id" ON public.pets;
CREATE POLICY "Public can read pets by id"
  ON public.pets FOR SELECT
  USING (true);

-- 2. Medical conditions — lectura pública
DROP POLICY IF EXISTS "Public can read medical conditions" ON public.pet_medical_conditions;
CREATE POLICY "Public can read medical conditions"
  ON public.pet_medical_conditions FOR SELECT
  USING (true);

-- 3. Medications — lectura pública
DROP POLICY IF EXISTS "Public can read medications" ON public.medications;
CREATE POLICY "Public can read medications"
  ON public.medications FOR SELECT
  USING (true);

-- 4. Vaccines — lectura pública
DROP POLICY IF EXISTS "Public can read vaccines" ON public.vaccines;
CREATE POLICY "Public can read vaccines"
  ON public.vaccines FOR SELECT
  USING (true);

-- 5. Appointments — lectura pública
DROP POLICY IF EXISTS "Public can read appointments" ON public.appointments;
CREATE POLICY "Public can read appointments"
  ON public.appointments FOR SELECT
  USING (true);
