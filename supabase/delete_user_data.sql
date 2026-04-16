-- ============================================================
-- KIMO — Eliminar todos los datos de un usuario para reset
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Luego ir a Authentication → Users y borrar el usuario
-- ============================================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN

  -- ── Obtener el ID del usuario por email ──────────────────
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'josebalbindev@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  RAISE NOTICE 'Borrando datos del usuario: %', v_user_id;

  -- ── 1. medication_checks ─────────────────────────────────
  DELETE FROM public.medication_checks
  WHERE medication_id IN (
    SELECT m.id FROM public.medications m
    JOIN public.pets p ON p.id = m.pet_id
    JOIN public.household_members hm ON hm.household_id = p.household_id
    WHERE hm.user_id = v_user_id
  );

  -- ── 2. vaccine_checks (si ya existe la tabla) ────────────
  DELETE FROM public.vaccine_checks
  WHERE vaccine_id IN (
    SELECT v.id FROM public.vaccines v
    JOIN public.pets p ON p.id = v.pet_id
    JOIN public.household_members hm ON hm.household_id = p.household_id
    WHERE hm.user_id = v_user_id
  );

  -- ── 3. medications ───────────────────────────────────────
  DELETE FROM public.medications
  WHERE pet_id IN (
    SELECT p.id FROM public.pets p
    JOIN public.household_members hm ON hm.household_id = p.household_id
    WHERE hm.user_id = v_user_id
  );

  -- ── 4. vaccines ──────────────────────────────────────────
  DELETE FROM public.vaccines
  WHERE pet_id IN (
    SELECT p.id FROM public.pets p
    JOIN public.household_members hm ON hm.household_id = p.household_id
    WHERE hm.user_id = v_user_id
  );

  -- ── 5. feedings ──────────────────────────────────────────
  DELETE FROM public.feedings
  WHERE pet_id IN (
    SELECT p.id FROM public.pets p
    JOIN public.household_members hm ON hm.household_id = p.household_id
    WHERE hm.user_id = v_user_id
  );

  -- ── 6. appointments ──────────────────────────────────────
  DELETE FROM public.appointments
  WHERE pet_id IN (
    SELECT p.id FROM public.pets p
    JOIN public.household_members hm ON hm.household_id = p.household_id
    WHERE hm.user_id = v_user_id
  );

  -- ── 7. weight_logs ───────────────────────────────────────
  DELETE FROM public.weight_logs
  WHERE pet_id IN (
    SELECT p.id FROM public.pets p
    JOIN public.household_members hm ON hm.household_id = p.household_id
    WHERE hm.user_id = v_user_id
  );

  -- ── 8. pets ──────────────────────────────────────────────
  DELETE FROM public.pets
  WHERE household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = v_user_id
  );

  -- ── 9. household_members ─────────────────────────────────
  DELETE FROM public.household_members WHERE user_id = v_user_id;

  -- ── 10. households (solo los que este usuario creó) ──────
  DELETE FROM public.households WHERE created_by = v_user_id;

  -- ── 11. profiles ─────────────────────────────────────────
  DELETE FROM public.profiles WHERE id = v_user_id;

  RAISE NOTICE '✅ Todos los datos eliminados. Ahora puedes borrar el usuario desde Authentication → Users.';

END $$;
