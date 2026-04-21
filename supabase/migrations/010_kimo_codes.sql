-- ============================================================
-- KIMO — Migration 010: KIMO Codes (unique user codes)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add kimo_code column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kimo_code text UNIQUE;

-- 2. Generate codes for existing users that don't have one
-- Format: 6-char uppercase alphanumeric (e.g. A3F7K2)
CREATE OR REPLACE FUNCTION public.generate_kimo_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- no I,O,0,1 to avoid confusion
  code text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Fill existing users
DO $$
DECLARE
  r record;
  new_code text;
  attempts int;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE kimo_code IS NULL LOOP
    attempts := 0;
    LOOP
      new_code := public.generate_kimo_code();
      BEGIN
        UPDATE public.profiles SET kimo_code = new_code WHERE id = r.id;
        EXIT; -- success
      EXCEPTION WHEN unique_violation THEN
        attempts := attempts + 1;
        IF attempts > 10 THEN RAISE EXCEPTION 'Too many collisions'; END IF;
      END;
    END LOOP;
  END LOOP;
END $$;

-- 3. Make NOT NULL after filling existing
ALTER TABLE public.profiles
  ALTER COLUMN kimo_code SET DEFAULT public.generate_kimo_code();

-- 4. Trigger to auto-generate on new profile insert if not provided
CREATE OR REPLACE FUNCTION public.ensure_kimo_code()
RETURNS trigger AS $$
DECLARE
  attempts int := 0;
BEGIN
  IF NEW.kimo_code IS NULL OR NEW.kimo_code = '' THEN
    LOOP
      NEW.kimo_code := public.generate_kimo_code();
      BEGIN
        -- Check uniqueness
        PERFORM 1 FROM public.profiles WHERE kimo_code = NEW.kimo_code;
        IF NOT FOUND THEN EXIT; END IF;
      END;
      attempts := attempts + 1;
      IF attempts > 10 THEN RAISE EXCEPTION 'Too many collisions generating kimo_code'; END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_kimo_code ON public.profiles;
CREATE TRIGGER trg_ensure_kimo_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_kimo_code();

-- 5. RPC: Look up a user's email by their KIMO code
-- Used by frontend to resolve code → email for invitations & transfers
CREATE OR REPLACE FUNCTION public.lookup_email_by_kimo_code(p_code text)
RETURNS text AS $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  SELECT id INTO v_user_id FROM public.profiles
  WHERE kimo_code = upper(trim(p_code));

  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Index
CREATE INDEX IF NOT EXISTS idx_profiles_kimo_code ON public.profiles(kimo_code);
