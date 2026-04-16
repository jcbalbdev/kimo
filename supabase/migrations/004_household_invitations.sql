-- ============================================================
-- KIMO — Migration 004: household_invitations
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Tabla principal ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.household_invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  invited_by   uuid REFERENCES public.profiles(id)  ON DELETE CASCADE NOT NULL,
  invited_email text,                            -- null si es link sin email
  token        uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

-- ── 2. RLS Policies ──────────────────────────────────────
-- NOTA: usar auth.email() en vez de subquery a auth.users
-- para evitar "permission denied for table users"

-- SELECT: invitado por email, link sin email (cualquier auth), o miembro del hogar
CREATE POLICY "inv_select" ON public.household_invitations
  FOR SELECT USING (
    invited_email = auth.email()
    OR invited_email IS NULL
    OR household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: solo miembros del hogar pueden invitar
CREATE POLICY "inv_insert" ON public.household_invitations
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
    AND invited_by = auth.uid()
  );

-- UPDATE: el invitado puede aceptar/rechazar (por email o link sin email)
CREATE POLICY "inv_update" ON public.household_invitations
  FOR UPDATE USING (
    invited_email = auth.email()
    OR invited_email IS NULL
    OR invited_by = auth.uid()
  );

-- DELETE: el que invitó o el owner del hogar puede cancelar la invitación
CREATE POLICY "inv_delete" ON public.household_invitations
  FOR DELETE USING (
    invited_by = auth.uid()
    OR household_id IN (
      SELECT household_id FROM public.household_members hm
      WHERE hm.user_id = auth.uid() AND hm.role = 'owner'
    )
  );

-- ── 3. Índices ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inv_household ON public.household_invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_inv_email     ON public.household_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_inv_token     ON public.household_invitations(token);
CREATE INDEX IF NOT EXISTS idx_inv_status    ON public.household_invitations(status);
