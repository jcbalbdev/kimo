-- ─────────────────────────────────────────────────────────────
-- 023 · App Feedback table
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating      smallint CHECK (rating BETWEEN 1 AND 5),
  category    text,          -- 'sugerencia' | 'bug' | 'me_encanta' | 'otro'
  comment     text NOT NULL CHECK (char_length(comment) >= 5),
  app_version text,
  created_at  timestamptz DEFAULT now()
);

-- Only authenticated users can insert their own feedback
ALTER TABLE app_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON app_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only service role (you) can read all feedback
CREATE POLICY "Service role reads all feedback"
  ON app_feedback FOR SELECT
  TO service_role
  USING (true);
