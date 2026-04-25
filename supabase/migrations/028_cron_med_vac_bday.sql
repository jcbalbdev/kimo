-- ============================================================
-- KIMO — Migration 028: Cron jobs para notificaciones de
--   medicamentos, vacunas y cumpleaños
-- Requiere que las Edge Functions estén desplegadas primero.
-- ============================================================

-- ── Helpers ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Base URL y auth headers reutilizables
DO $$ BEGIN NULL; END $$; -- no-op block para organización

-- ══════════════════════════════════════════════════════════════
-- CRON 1: Medicamentos — cada hora (igual que comidas)
-- Llama a notify-medications que revisa slots ±30 min
-- ══════════════════════════════════════════════════════════════
SELECT cron.schedule(
  'notify-medications-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://siyoqpviurmdilwqoakz.supabase.co/functions/v1/notify-medications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeW9xcHZpdXJtZGlsd3FvYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTc2NjYsImV4cCI6MjA5MTY5MzY2Nn0.vDWQN4RvQ_e7Avfx1j7FLIcmQdHX9H4XEagWwDC4XLA',
      'apikey',        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeW9xcHZpdXJtZGlsd3FvYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTc2NjYsImV4cCI6MjA5MTY5MzY2Nn0.vDWQN4RvQ_e7Avfx1j7FLIcmQdHX9H4XEagWwDC4XLA'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ══════════════════════════════════════════════════════════════
-- CRON 2: Vacunas — diario a las 9am UTC
-- Detecta: próxima dosis en 7d, en 1d, y vencida hace 7d
-- ══════════════════════════════════════════════════════════════
SELECT cron.schedule(
  'notify-vaccines-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://siyoqpviurmdilwqoakz.supabase.co/functions/v1/notify-vaccines',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeW9xcHZpdXJtZGlsd3FvYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTc2NjYsImV4cCI6MjA5MTY5MzY2Nn0.vDWQN4RvQ_e7Avfx1j7FLIcmQdHX9H4XEagWwDC4XLA',
      'apikey',        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeW9xcHZpdXJtZGlsd3FvYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTc2NjYsImV4cCI6MjA5MTY5MzY2Nn0.vDWQN4RvQ_e7Avfx1j7FLIcmQdHX9H4XEagWwDC4XLA'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ══════════════════════════════════════════════════════════════
-- CRON 3: Cumpleaños — diario a las 9am UTC
-- Detecta mascotas cuyo birth_date es hoy
-- ══════════════════════════════════════════════════════════════
SELECT cron.schedule(
  'notify-birthdays-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://siyoqpviurmdilwqoakz.supabase.co/functions/v1/notify-birthdays',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeW9xcHZpdXJtZGlsd3FvYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTc2NjYsImV4cCI6MjA5MTY5MzY2Nn0.vDWQN4RvQ_e7Avfx1j7FLIcmQdHX9H4XEagWwDC4XLA',
      'apikey',        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeW9xcHZpdXJtZGlsd3FvYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTc2NjYsImV4cCI6MjA5MTY5MzY2Nn0.vDWQN4RvQ_e7Avfx1j7FLIcmQdHX9H4XEagWwDC4XLA'
    ),
    body := '{}'::jsonb
  );
  $$
);
