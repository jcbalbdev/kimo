-- ─────────────────────────────────────────────────────────────
-- 025 · Adoption status for shelter pets
-- ─────────────────────────────────────────────────────────────

ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS adoption_status text
    CHECK (adoption_status IN (
      'disponible',
      'urgente',
      'en_cuarentena',
      'en_tratamiento',
      'en_transito',
      'reservado'
    ));

-- Index for filtering by status in directory queries
CREATE INDEX IF NOT EXISTS pets_adoption_status_idx ON pets (adoption_status);
