-- Activity log for form history
CREATE TABLE IF NOT EXISTS form_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  collaborator_id uuid REFERENCES form_collaborators(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE form_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Form participants can view activity"
  ON form_activity_log FOR SELECT
  USING (
    form_id IN (SELECT id FROM forms WHERE user_id = auth.uid())
    OR
    collaborator_id IN (SELECT id FROM form_collaborators WHERE form_id IN (SELECT id FROM forms))
  );

CREATE POLICY "Form owner can insert activity"
  ON form_activity_log FOR INSERT
  WITH CHECK (
    form_id IN (SELECT id FROM forms WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_activity_form ON form_activity_log(form_id, created_at DESC);

-- Add logo_url to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url text;

-- Add avatar_url to collaborators
ALTER TABLE form_collaborators ADD COLUMN IF NOT EXISTS avatar_url text;
