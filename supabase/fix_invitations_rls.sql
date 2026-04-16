-- ============================================================
-- KIMO — Fix: RLS policies para household_invitations
-- Usar auth.email() en vez de subquery a auth.users
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Borrar políticas anteriores con el error
DROP POLICY IF EXISTS "inv_select"         ON public.household_invitations;
DROP POLICY IF EXISTS "inv_select_invited" ON public.household_invitations;
DROP POLICY IF EXISTS "inv_select_member"  ON public.household_invitations;
DROP POLICY IF EXISTS "inv_insert"         ON public.household_invitations;
DROP POLICY IF EXISTS "inv_update"         ON public.household_invitations;
DROP POLICY IF EXISTS "inv_delete"         ON public.household_invitations;

-- ── SELECT: usar auth.email() (no requiere acceso a auth.users) ──
CREATE POLICY "inv_select" ON public.household_invitations
  FOR SELECT USING (
    invited_email = auth.email()           -- invitado por email
    OR invited_email IS NULL               -- link sin email (cualquier auth)
    OR household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- ── INSERT: solo miembros del hogar ──────────────────────────────
CREATE POLICY "inv_insert" ON public.household_invitations
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
    AND invited_by = auth.uid()
  );

-- ── UPDATE: invitado puede aceptar/rechazar ───────────────────────
CREATE POLICY "inv_update" ON public.household_invitations
  FOR UPDATE USING (
    invited_email = auth.email()           -- el invitado por email
    OR invited_email IS NULL               -- link invite: cualquier auth con el token
    OR invited_by = auth.uid()            -- el que invitó puede cancelar
  );

-- ── DELETE: el invitador o el owner del hogar ────────────────────
CREATE POLICY "inv_delete" ON public.household_invitations
  FOR DELETE USING (
    invited_by = auth.uid()
    OR household_id IN (
      SELECT household_id FROM public.household_members hm
      WHERE hm.user_id = auth.uid() AND hm.role = 'owner'
    )
  );
