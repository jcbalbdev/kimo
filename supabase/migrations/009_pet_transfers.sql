-- ============================================================
-- KIMO — Migration 009: Pet Transfers
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- IDEMPOTENTE: se puede ejecutar varias veces sin error
-- ============================================================

-- ── 1. Tabla principal ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pet_transfers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          uuid REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  from_household  uuid REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  to_email        text,                    -- email del receptor
  token           uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  to_household    uuid REFERENCES public.households(id) ON DELETE SET NULL,
  initiated_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

ALTER TABLE public.pet_transfers ENABLE ROW LEVEL SECURITY;

-- ── 2. RLS Policies (drop first to be idempotent) ────────

-- SELECT: emisor (miembro del hogar origen) o receptor (por email)
DROP POLICY IF EXISTS "transfer_select" ON public.pet_transfers;
CREATE POLICY "transfer_select" ON public.pet_transfers
  FOR SELECT USING (
    to_email = auth.email()
    OR to_email IS NULL
    OR from_household IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: solo miembros del hogar que tiene la mascota
DROP POLICY IF EXISTS "transfer_insert" ON public.pet_transfers;
CREATE POLICY "transfer_insert" ON public.pet_transfers
  FOR INSERT WITH CHECK (
    initiated_by = auth.uid()
    AND from_household IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE: receptor puede aceptar/rechazar, emisor puede cancelar
DROP POLICY IF EXISTS "transfer_update" ON public.pet_transfers;
CREATE POLICY "transfer_update" ON public.pet_transfers
  FOR UPDATE USING (
    to_email = auth.email()
    OR to_email IS NULL
    OR initiated_by = auth.uid()
  );

-- DELETE: solo el emisor puede eliminar
DROP POLICY IF EXISTS "transfer_delete" ON public.pet_transfers;
CREATE POLICY "transfer_delete" ON public.pet_transfers
  FOR DELETE USING (
    initiated_by = auth.uid()
  );

-- ── 3. Índices ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transfer_pet      ON public.pet_transfers(pet_id);
CREATE INDEX IF NOT EXISTS idx_transfer_email    ON public.pet_transfers(to_email);
CREATE INDEX IF NOT EXISTS idx_transfer_token    ON public.pet_transfers(token);
CREATE INDEX IF NOT EXISTS idx_transfer_status   ON public.pet_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfer_from     ON public.pet_transfers(from_household);

-- ── 4. RPC: accept_pet_transfer ───────────────────────────
-- Función SECURITY DEFINER para hacer el traslado atómicamente.
-- El receptor NO tiene permisos RLS para UPDATE sobre la mascota
-- del otro hogar, así que necesitamos esta función privilegiada.

CREATE OR REPLACE FUNCTION public.accept_pet_transfer(
  p_transfer_id uuid,
  p_to_household_id uuid
) RETURNS void AS $$
DECLARE
  v_transfer record;
BEGIN
  -- Verificar que el transfer existe y está pendiente
  SELECT * INTO v_transfer FROM public.pet_transfers
  WHERE id = p_transfer_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found or already processed';
  END IF;
  
  -- Verificar que el usuario actual es el receptor
  IF v_transfer.to_email IS NOT NULL AND v_transfer.to_email != auth.email() THEN
    RAISE EXCEPTION 'You are not the intended recipient';
  END IF;
  
  -- Verificar que el usuario es miembro del hogar destino
  IF NOT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = p_to_household_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of target household';
  END IF;
  
  -- Mover la mascota al nuevo hogar
  UPDATE public.pets SET household_id = p_to_household_id WHERE id = v_transfer.pet_id;
  
  -- Marcar transfer completado
  UPDATE public.pet_transfers
  SET status = 'accepted',
      to_household = p_to_household_id,
      completed_at = now()
  WHERE id = p_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Habilitar Realtime ─────────────────────────────────
-- Para que el receptor vea el modal en tiempo real
-- Idempotent: ignora error si ya está en la publicación
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pet_transfers;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- ya existe, ignorar
END $$;
