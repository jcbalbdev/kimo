-- ============================================================
-- KIMO — Fix: member count para household cards
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Función SECURITY DEFINER: cuenta todos los miembros de un hogar
-- Bypasea RLS seguramente porque solo devuelve un número, no datos
CREATE OR REPLACE FUNCTION public.get_household_member_count(p_household_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM public.household_members
  WHERE household_id = p_household_id;
$$;

-- Dar permiso a usuarios autenticados de llamar la función
GRANT EXECUTE ON FUNCTION public.get_household_member_count(uuid) TO authenticated;
