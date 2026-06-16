-- Add gender field to clothes
CREATE TYPE gender_type AS ENUM ('boys', 'girls', 'unassigned');

ALTER TABLE clothes
  ADD COLUMN gender gender_type NOT NULL DEFAULT 'unassigned';

CREATE INDEX idx_clothes_gender ON clothes(gender);
