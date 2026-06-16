-- Add clothing_type field to clothes
CREATE TYPE clothing_type AS ENUM (
  'set', 'shirt', 'pants', 'skirt', 'jumper', 'pajamas',
  'overall', 'dress', 'underwear', 'tights', 'socks',
  'hair_accessory', 'unassigned'
);

ALTER TABLE clothes
  ADD COLUMN clothing_type clothing_type NOT NULL DEFAULT 'unassigned';

CREATE INDEX idx_clothes_clothing_type ON clothes(clothing_type);
