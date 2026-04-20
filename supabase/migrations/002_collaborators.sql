-- Form collaborators: share forms with people without accounts
CREATE TABLE IF NOT EXISTS form_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  email text NOT NULL,
  senha_hash text NOT NULL,
  nome text NOT NULL,
  role text NOT NULL CHECK (role IN ('editor', 'viewer', 'readonly')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(form_id, email)
);

ALTER TABLE form_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage collaborators"
  ON form_collaborators
  FOR ALL
  USING (
    form_id IN (SELECT id FROM forms WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_collaborators_form ON form_collaborators(form_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON form_collaborators(form_id, email);
