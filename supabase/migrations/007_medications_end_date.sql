-- ============================================================
-- KIMO — Migration 007: Medications end_date
-- Adds an optional end_date to track treatment duration.
-- Safe to run multiple times (idempotent).
-- ============================================================

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS end_date date;
