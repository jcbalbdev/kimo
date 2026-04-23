-- ============================================================
-- KIMO — Migration 016: Add timezone to device_tokens
-- La zona horaria real SIEMPRE se guarda desde el dispositivo:
--   Intl.DateTimeFormat().resolvedOptions().timeZone
-- El DEFAULT solo aplica a filas existentes antes de esta migración.
-- ============================================================

ALTER TABLE public.device_tokens
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Mexico_City';
