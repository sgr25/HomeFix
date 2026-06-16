-- Add user_id for multi-tenant auth + RLS policies

ALTER TABLE children ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE boxes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE clothes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_boxes_user_id ON boxes(user_id);
CREATE INDEX IF NOT EXISTS idx_clothes_user_id ON clothes(user_id);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "children_select" ON children;
DROP POLICY IF EXISTS "children_insert" ON children;
DROP POLICY IF EXISTS "children_update" ON children;
DROP POLICY IF EXISTS "children_delete" ON children;
DROP POLICY IF EXISTS "boxes_select" ON boxes;
DROP POLICY IF EXISTS "boxes_insert" ON boxes;
DROP POLICY IF EXISTS "boxes_update" ON boxes;
DROP POLICY IF EXISTS "boxes_delete" ON boxes;
DROP POLICY IF EXISTS "clothes_select" ON clothes;
DROP POLICY IF EXISTS "clothes_insert" ON clothes;
DROP POLICY IF EXISTS "clothes_update" ON clothes;
DROP POLICY IF EXISTS "clothes_delete" ON clothes;

-- Authenticated users see own rows or legacy rows without user_id
CREATE POLICY "children_select" ON children FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "children_insert" ON children FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "children_update" ON children FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "children_delete" ON children FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "boxes_select" ON boxes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "boxes_insert" ON boxes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "boxes_update" ON boxes FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "boxes_delete" ON boxes FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "clothes_select" ON clothes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "clothes_insert" ON clothes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "clothes_update" ON clothes FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "clothes_delete" ON clothes FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);
