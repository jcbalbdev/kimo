-- ============================================================
-- KIMO — Migration 015: Notification Preferences
-- Tabla global de preferencias de notificación por usuario y mascota
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pet_id            uuid        REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  notification_type text        NOT NULL
                    CHECK (notification_type IN (
                      'feeding',       -- recordatorios de comida
                      'medication',    -- recordatorios de medicamento
                      'vaccine',       -- vacunas próximas / vencidas
                      'appointment',   -- citas veterinarias
                      'health_alert'   -- alertas médicas (vómitos repetidos, etc.)
                    )),
  enabled           boolean     NOT NULL DEFAULT true,
  created_at        timestamptz DEFAULT now(),

  UNIQUE (user_id, pet_id, notification_type)
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_notif_pref_user ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_pref_pet  ON public.notification_preferences(pet_id);

-- Row Level Security
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Auto-inscripción del owner al crear una mascota ──────────
-- Cuando se inserta una nueva mascota, el owner del hogar
-- se inscribe automáticamente a todos los tipos de notificación.

CREATE OR REPLACE FUNCTION public.auto_enroll_owner_notifications()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id, pet_id, notification_type)
  SELECT
    hm.user_id,
    NEW.id,
    t.type
  FROM public.household_members hm
  CROSS JOIN (VALUES
    ('feeding'),
    ('medication'),
    ('vaccine'),
    ('appointment'),
    ('health_alert')
  ) AS t(type)
  WHERE hm.household_id = NEW.household_id
    AND hm.role = 'owner'
  ON CONFLICT (user_id, pet_id, notification_type) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_enroll_notifications ON public.pets;
CREATE TRIGGER trg_auto_enroll_notifications
  AFTER INSERT ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enroll_owner_notifications();

-- ── Inscripción de mascotas existentes para usuarios actuales ─
-- Ejecutar una sola vez para retrocompatibilidad
INSERT INTO public.notification_preferences (user_id, pet_id, notification_type)
SELECT
  hm.user_id,
  p.id,
  t.type
FROM public.pets p
JOIN public.household_members hm ON hm.household_id = p.household_id AND hm.role = 'owner'
CROSS JOIN (VALUES
  ('feeding'),
  ('medication'),
  ('vaccine'),
  ('appointment'),
  ('health_alert')
) AS t(type)
ON CONFLICT (user_id, pet_id, notification_type) DO NOTHING;
