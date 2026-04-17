-- ──────────────────────────────────────────────────────────────────────────
-- 005_get_household_members_fn.sql  (v2 — simplified, no auth.uid() guard)
-- Returns all members (with profile info) for a given household.
-- Protected by GRANT EXECUTE TO authenticated only.
-- ──────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS get_household_members(UUID);

CREATE OR REPLACE FUNCTION get_household_members(p_household_id UUID)
RETURNS TABLE (
  member_id    UUID,
  user_id      UUID,
  member_role  TEXT,
  joined_at    TIMESTAMPTZ,
  display_name TEXT,
  avatar_emoji TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    hm.id::UUID            AS member_id,
    hm.user_id::UUID       AS user_id,
    hm.role::TEXT          AS member_role,
    hm.joined_at           AS joined_at,
    COALESCE(p.display_name, 'Sin nombre')::TEXT AS display_name,
    p.avatar_emoji::TEXT   AS avatar_emoji
  FROM household_members hm
  LEFT JOIN profiles p ON p.id = hm.user_id
  WHERE hm.household_id = p_household_id
  ORDER BY hm.joined_at ASC;
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION get_household_members(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_household_members(UUID) TO authenticated;
