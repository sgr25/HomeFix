-- Add gender field to children (reuses gender_type from 005_add_gender.sql)
ALTER TABLE children
  ADD COLUMN gender gender_type;
