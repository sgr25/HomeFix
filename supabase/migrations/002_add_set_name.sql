-- Add set_name column to clothes for outfit set grouping
ALTER TABLE clothes ADD COLUMN IF NOT EXISTS set_name TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_clothes_set_name ON clothes(set_name);
