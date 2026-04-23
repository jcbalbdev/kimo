-- ============================================================
-- KIMO — Migration 017: RPCs para notificaciones de alimentación
-- Usadas por la Edge Function notify-feedings
-- ============================================================

-- ── RPC 1: Mascotas sin ningún registro de comida HOY ────────
-- Respeta notification_preferences (feeding, enabled)
-- Devuelve un registro por (token, pet) para agrupar en la Edge Function

CREATE OR REPLACE FUNCTION public.get_pets_no_feeding_today()
RETURNS TABLE (
  token       text,
  timezone    text,
  pet_names   text
) AS $$
  SELECT
    dt.token,
    dt.timezone,
    p.name AS pet_names
  FROM pets p
  JOIN household_members hm    ON hm.household_id = p.household_id
  JOIN device_tokens dt        ON dt.user_id = hm.user_id
  JOIN notification_preferences np
    ON np.user_id = hm.user_id
    AND np.pet_id = p.id
    AND np.notification_type = 'feeding'
    AND np.enabled = true
  WHERE
    -- Ninguna comida registrada hoy (incluye mascotas sin historial previo)
    NOT EXISTS (
      SELECT 1 FROM feedings f
      WHERE f.pet_id = p.id AND f.date = CURRENT_DATE
    );
$$ LANGUAGE sql SECURITY DEFINER;


-- ── RPC 2: Mascotas sin registro en los últimos 3 días ───────
-- Se usa para detectar inactividad en el registro de alimentación

CREATE OR REPLACE FUNCTION public.get_pets_inactive_feeding()
RETURNS TABLE (
  token       text,
  timezone    text,
  pet_names   text
) AS $$
  SELECT
    dt.token,
    dt.timezone,
    p.name AS pet_names
  FROM pets p
  JOIN household_members hm    ON hm.household_id = p.household_id
  JOIN device_tokens dt        ON dt.user_id = hm.user_id
  JOIN notification_preferences np
    ON np.user_id = hm.user_id
    AND np.pet_id = p.id
    AND np.notification_type = 'feeding'
    AND np.enabled = true
  WHERE
    -- La mascota tiene historial de comidas (no es un usuario nuevo)
    EXISTS (
      SELECT 1 FROM feedings f WHERE f.pet_id = p.id
    )
    -- Pero no hay ningún registro en los últimos 3 días
    AND NOT EXISTS (
      SELECT 1 FROM feedings f
      WHERE f.pet_id = p.id
        AND f.date >= CURRENT_DATE - INTERVAL '3 days'
    );
$$ LANGUAGE sql SECURITY DEFINER;
