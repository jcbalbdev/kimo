-- ============================================================
-- KIMO — Migration 027: RPCs para notificaciones de
--   medicamentos, vacunas y cumpleaños de mascotas
-- Usadas por las Edge Functions:
--   notify-medications | notify-vaccines | notify-birthdays
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- 1. MEDICAMENTOS
--    Devuelve las dosis activas cuyo slot cae en la hora actual
--    (±30 min) y aún no tienen medication_check registrado.
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_medication_doses_due()
RETURNS TABLE (
  token         text,
  timezone      text,
  pet_name      text,
  med_name      text,
  dose          text,
  scheduled_at  timestamptz
) AS $$
  SELECT
    dt.token,
    dt.timezone,
    p.name        AS pet_name,
    m.name        AS med_name,
    m.dose        AS dose,
    -- Slot más cercano a la hora actual
    (
      m.start_date::timestamptz
      + (m.start_time::text)::interval
      + (
          FLOOR(
            EXTRACT(EPOCH FROM (NOW() - (m.start_date::timestamptz + (m.start_time::text)::interval)))
            / (m.interval_hours * 3600)
          ) * m.interval_hours * 3600 * INTERVAL '1 second'
        )
    ) AS scheduled_at

  FROM medications m
  JOIN pets p                ON p.id = m.pet_id
  JOIN household_members hm  ON hm.household_id = p.household_id
  JOIN device_tokens dt      ON dt.user_id = hm.user_id
  -- Preferencia habilitada (medication)
  JOIN notification_preferences np
    ON np.user_id = hm.user_id
    AND np.pet_id = p.id
    AND np.notification_type = 'medication'
    AND np.enabled = true

  WHERE
    m.is_active = true
    AND m.ended_at IS NULL
    -- El slot cae en ±30 minutos de ahora
    AND (
      m.start_date::timestamptz + (m.start_time::text)::interval
      + (
          FLOOR(
            EXTRACT(EPOCH FROM (NOW() - (m.start_date::timestamptz + (m.start_time::text)::interval)))
            / (m.interval_hours * 3600)
          ) * m.interval_hours * 3600 * INTERVAL '1 second'
        )
    ) BETWEEN NOW() - INTERVAL '30 minutes' AND NOW() + INTERVAL '30 minutes'
    -- El slot aún no fue marcado
    AND NOT EXISTS (
      SELECT 1 FROM medication_checks mc
      WHERE mc.medication_id = m.id
        AND ABS(EXTRACT(EPOCH FROM (mc.scheduled_at - (
          m.start_date::timestamptz + (m.start_time::text)::interval
          + (
              FLOOR(
                EXTRACT(EPOCH FROM (NOW() - (m.start_date::timestamptz + (m.start_time::text)::interval)))
                / (m.interval_hours * 3600)
              ) * m.interval_hours * 3600 * INTERVAL '1 second'
            )
        )))) < 1800  -- 30 min tolerance
    );
$$ LANGUAGE sql SECURITY DEFINER;


-- ══════════════════════════════════════════════════════════════
-- 2. VACUNAS
--    Devuelve vacunas con próxima dosis en exactamente 7 días
--    o con dosis vencida hace exactamente 7 días (atrasada).
--    Solo se dispara una vez por día (cron diario).
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_vaccines_due()
RETURNS TABLE (
  token        text,
  timezone     text,
  pet_name     text,
  vaccine_name text,
  next_date    date,
  alert_type   text   -- 'upcoming_7d' | 'upcoming_1d' | 'overdue_7d'
) AS $$
  SELECT
    dt.token,
    dt.timezone,
    p.name  AS pet_name,
    v.name  AS vaccine_name,
    -- Próxima dosis = date + interval_days (simplificado para 1er ciclo)
    (v.date::date + v.interval_days * INTERVAL '1 day')::date AS next_date,
    CASE
      WHEN (v.date::date + v.interval_days * INTERVAL '1 day')::date = CURRENT_DATE + 7
        THEN 'upcoming_7d'
      WHEN (v.date::date + v.interval_days * INTERVAL '1 day')::date = CURRENT_DATE + 1
        THEN 'upcoming_1d'
      WHEN (v.date::date + v.interval_days * INTERVAL '1 day')::date = CURRENT_DATE - 7
        THEN 'overdue_7d'
    END AS alert_type

  FROM vaccines v
  JOIN pets p                ON p.id = v.pet_id
  JOIN household_members hm  ON hm.household_id = p.household_id
  JOIN device_tokens dt      ON dt.user_id = hm.user_id
  JOIN notification_preferences np
    ON np.user_id = hm.user_id
    AND np.pet_id = p.id
    AND np.notification_type = 'vaccine'
    AND np.enabled = true

  WHERE
    v.ended_at IS NULL
    AND v.interval_days IS NOT NULL
    -- El slot de la próxima dosis es en 7d, 1d o lleva 7d vencido
    AND (v.date::date + v.interval_days * INTERVAL '1 day')::date IN (
      CURRENT_DATE + 7,
      CURRENT_DATE + 1,
      CURRENT_DATE - 7
    )
    -- La próxima dosis no ha sido marcada como checked
    AND NOT EXISTS (
      SELECT 1 FROM vaccine_checks vc
      WHERE vc.vaccine_id = v.id
        AND vc.scheduled_date = (v.date::date + v.interval_days * INTERVAL '1 day')::date
    );
$$ LANGUAGE sql SECURITY DEFINER;


-- ══════════════════════════════════════════════════════════════
-- 3. CUMPLEAÑOS
--    Devuelve mascotas cuyo birth_date cae HOY (mes + día).
--    Calcula los años que cumple para personalizar el mensaje.
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_pet_birthdays_today()
RETURNS TABLE (
  token      text,
  timezone   text,
  pet_name   text,
  years_old  int
) AS $$
  SELECT
    dt.token,
    dt.timezone,
    p.name AS pet_name,
    DATE_PART('year', AGE(CURRENT_DATE, p.birth_date))::int AS years_old

  FROM pets p
  JOIN household_members hm  ON hm.household_id = p.household_id
  JOIN device_tokens dt      ON dt.user_id = hm.user_id

  WHERE
    p.birth_date IS NOT NULL
    -- Mismo mes y día que hoy, sin importar el año
    AND EXTRACT(MONTH FROM p.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY   FROM p.birth_date) = EXTRACT(DAY   FROM CURRENT_DATE)
    -- No notificar el año del nacimiento (años = 0)
    AND DATE_PART('year', AGE(CURRENT_DATE, p.birth_date)) > 0;
$$ LANGUAGE sql SECURITY DEFINER;
