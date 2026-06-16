-- =====================================================
-- Smart Wardrobe Management — Initial Schema
-- Run this in your Supabase SQL editor
-- =====================================================

-- Enums
CREATE TYPE season_type AS ENUM ('summer', 'winter', 'transition');
CREATE TYPE status_type AS ENUM ('in_closet', 'laundry', 'in_box');

-- Children
CREATE TABLE children (
  name          TEXT PRIMARY KEY,
  current_sizes TEXT[] NOT NULL DEFAULT '{}',
  active        BOOLEAN NOT NULL DEFAULT true
);

-- Boxes (physical storage boxes)
CREATE TABLE boxes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_number  INT  UNIQUE NOT NULL,
  description TEXT
);

-- Clothes
CREATE TABLE clothes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT REFERENCES children(name) ON DELETE SET NULL,
  size       TEXT NOT NULL,
  season     season_type NOT NULL,
  image_url  TEXT,
  status     status_type NOT NULL DEFAULT 'in_closet',
  box_id     UUID REFERENCES boxes(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT box_integrity CHECK (
    (status = 'in_box'  AND box_id IS NOT NULL) OR
    (status != 'in_box' AND box_id IS NULL)
  )
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clothes_updated_at
  BEFORE UPDATE ON clothes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for common query patterns
CREATE INDEX idx_clothes_child_name ON clothes(child_name);
CREATE INDEX idx_clothes_status     ON clothes(status);
CREATE INDEX idx_clothes_season     ON clothes(season);
CREATE INDEX idx_clothes_box_id     ON clothes(box_id);

-- =====================================================
-- Supabase Storage: create a PUBLIC bucket named
-- "clothing-images" via the Supabase dashboard or:
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('clothing-images', 'clothing-images', true);
-- =====================================================
