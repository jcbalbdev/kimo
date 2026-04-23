-- ============================================================
-- KIMO — Migration 018: Cron job para notificaciones de comida
-- Llama a la Edge Function notify-feedings cada hora
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear (o reemplazar) el cron job
SELECT cron.schedule(
  'notify-feedings-hourly',   -- nombre único del job
  '0 * * * *',                -- cada hora en punto (ej: 10:00, 11:00, 12:00...)
  $$
  SELECT net.http_post(
    url     := 'https://siyoqpviurmdilwqoakz.supabase.co/functions/v1/notify-feedings',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeW9xcHZpdXJtZGlsd3FvYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTc2NjYsImV4cCI6MjA5MTY5MzY2Nn0.vDWQN4RvQ_e7Avfx1j7FLIcmQdHX9H4XEagWwDC4XLA',
      'apikey',        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeW9xcHZpdXJtZGlsd3FvYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTc2NjYsImV4cCI6MjA5MTY5MzY2Nn0.vDWQN4RvQ_e7Avfx1j7FLIcmQdHX9H4XEagWwDC4XLA'
    ),
    body := '{}'::jsonb
  );
  $$
);
